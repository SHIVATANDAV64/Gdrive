 

import { Client, Databases, Query } from 'node-appwrite';





 

function requireEnv(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

function getEnvConfig() {
    return {
        databaseId: requireEnv('APPWRITE_DATABASE_ID'),
        collections: {
            users: requireEnv('COLLECTION_USERS'),
            folders: requireEnv('COLLECTION_FOLDERS'),
            files: requireEnv('COLLECTION_FILES'),
            shares: requireEnv('COLLECTION_SHARES'),
            linkShares: requireEnv('COLLECTION_LINK_SHARES'),
            stars: requireEnv('COLLECTION_STARS'),
            activities: requireEnv('COLLECTION_ACTIVITIES'),
        },
        buckets: {
            userFiles: requireEnv('BUCKET_USER_FILES'),
        },
        settings: {
            maxFileSize: parseInt(requireEnv('MAX_FILE_SIZE_BYTES'), 10),
            trashRetentionDays: parseInt(requireEnv('TRASH_RETENTION_DAYS'), 10),
            maxVersionHistory: parseInt(requireEnv('MAX_VERSION_HISTORY'), 10),
        },
    };
}

 
function success(context, data, status = 200) {
    const response = { success: true, data };
    return context.res.json(response, status);
}

 
function error(context, code, message, status = 400) {
    const response = { success: false, error: { code, message } };
    return context.res.json(response, status);
}

 
function unauthorized(context, message = 'Unauthorized') {
    return error(context, 'UNAUTHORIZED', message, 401);
}

 
function serverError(context, message = 'Internal server error') {
    return error(context, 'INTERNAL_ERROR', message, 500);
}

 
function parseBody(context) {
    try {
        if (!context.req.body) return null;
        return JSON.parse(context.req.body);
    } catch {
        return null;
    }
}

 
function getUserId(context) {
    return context.req.headers['x-appwrite-user-id'] || null;
}

 
function sanitizeQuery(query) {
    if (!query) return '';
    
    let sanitized = query.substring(0, 200);
    
    return sanitized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}





const config = getEnvConfig();

 
function getClient(context) {
    return new Client()
        .setEndpoint(requireEnv('APPWRITE_FUNCTION_API_ENDPOINT'))
        .setProject(requireEnv('APPWRITE_FUNCTION_PROJECT_ID'))
        .setKey(process.env.APPWRITE_API_KEY || context.req.headers['x-appwrite-key'] || '');
}





 
export default async function main(context) {
    const userId = getUserId(context);

    if (!userId) {
        return unauthorized(context);
    }

    const client = getClient(context);
    const databases = new Databases(client);

    const { method, query: queryParams } = context.req;

    context.log(`Search Files: ${method}`);

    if (method !== 'GET' && method !== 'POST') {
        return error(context, 'METHOD_NOT_ALLOWED', 'Method not allowed', 405);
    }

    try {
        
        let searchInput;

        if (method === 'GET') {
            searchInput = {
                query: queryParams.q || '',
                type: queryParams.type || 'all',
                limit: parseInt(queryParams.limit || '50', 10),
                offset: parseInt(queryParams.offset || '0', 10),
            };
        } else {
            const body = parseBody(context);
            if (!body) {
                return error(context, 'INVALID_INPUT', 'Search query required');
            }
            searchInput = body;
        }

        const { query, type = 'all', limit = 50, offset = 0 } = searchInput;
        const sanitizedQuery = sanitizeQuery(query);

        if (!sanitizedQuery || sanitizedQuery.trim().length === 0) {
            return success(context, { files: [], folders: [], total: 0 });
        }

        const files = [];
        const folders = [];

        
        if (type === 'all' || type === 'file') {
            const fileResult = await databases.listDocuments(
                config.databaseId,
                config.collections.files,
                [
                    Query.equal('ownerId', userId),
                    Query.equal('isDeleted', false),
                    Query.search('name', sanitizedQuery),
                    Query.limit(limit),
                    Query.offset(offset),
                ]
            );

            files.push(...fileResult.documents);
        }

        
        if (type === 'all' || type === 'folder') {
            const folderResult = await databases.listDocuments(
                config.databaseId,
                config.collections.folders,
                [
                    Query.equal('ownerId', userId),
                    Query.equal('isDeleted', false),
                    Query.search('name', sanitizedQuery),
                    Query.limit(limit),
                    Query.offset(offset),
                ]
            );

            folders.push(...folderResult.documents);
        }

        return success(context, {
            files,
            folders,
            total: files.length + folders.length,
        });
    } catch (err) {
        context.error(`Search error: ${err}`);
        return serverError(context);
    }
}

