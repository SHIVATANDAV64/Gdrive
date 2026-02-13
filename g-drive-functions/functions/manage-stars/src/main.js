 

import { Client, Databases, Query, ID, Permission, Role } from 'node-appwrite';





 

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

 
function notFound(context, message = 'Not found') {
    return error(context, 'NOT_FOUND', message, 404);
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





const config = getEnvConfig();

 
function getClient(context) {
    return new Client()
        .setEndpoint(requireEnv('APPWRITE_FUNCTION_API_ENDPOINT'))
        .setProject(requireEnv('APPWRITE_FUNCTION_PROJECT_ID'))
        .setKey(process.env.APPWRITE_API_KEY || context.req.headers['x-appwrite-key'] || '');
}





 
async function listStars(context, databases, userId) {
    try {
        const result = await databases.listDocuments(
            config.databaseId,
            config.collections.stars,
            [
                Query.equal('userId', userId),
                Query.limit(100),
            ]
        );

        
        const starredItems = [];

        for (const star of result.documents) {
            try {
                const collection = star.resourceType === 'file'
                    ? config.collections.files
                    : config.collections.folders;

                const resource = await databases.getDocument(
                    config.databaseId,
                    collection,
                    star.resourceId
                );

                
                if (!resource.isDeleted) {
                    starredItems.push({
                        star,
                        resource,
                        resourceType: star.resourceType,
                    });
                }
            } catch {
                
            }
        }

        return success(context, {
            items: starredItems,
            total: starredItems.length,
        });
    } catch (err) {
        context.error(`List stars error: ${err}`);
        return serverError(context);
    }
}

 
async function starItem(context, databases, userId) {
    const input = parseBody(context);

    if (!input || !input.resourceType || !input.resourceId) {
        return error(context, 'INVALID_INPUT', 'resourceType and resourceId required');
    }

    if (input.resourceType !== 'file' && input.resourceType !== 'folder') {
        return error(context, 'INVALID_INPUT', 'resourceType must be "file" or "folder"');
    }

    try {
        
        const collection = input.resourceType === 'file'
            ? config.collections.files
            : config.collections.folders;

        const resource = await databases.getDocument(
            config.databaseId,
            collection,
            input.resourceId
        );

        if (resource.ownerId !== userId) {
            
            return error(context, 'FORBIDDEN', 'You do not have access to this resource', 403);
        }

        
        const existing = await databases.listDocuments(
            config.databaseId,
            config.collections.stars,
            [
                Query.equal('userId', userId),
                Query.equal('resourceType', input.resourceType),
                Query.equal('resourceId', input.resourceId),
                Query.limit(1),
            ]
        );

        if (existing.total > 0) {
            return error(context, 'ALREADY_EXISTS', 'Item is already starred');
        }

        
        const star = await databases.createDocument(
            config.databaseId,
            config.collections.stars,
            ID.unique(),
            {
                userId,
                resourceType: input.resourceType,
                resourceId: input.resourceId,
            },
            [
                Permission.read(Role.user(userId)),
                Permission.update(Role.user(userId)),
                Permission.delete(Role.user(userId)),
            ]
        );

        return success(context, star, 201);
    } catch (err) {
        if (err?.code === 404) {
            return notFound(context, 'Resource not found');
        }
        context.error(`Star item error: ${err}`);
        return serverError(context);
    }
}

 
async function unstarItem(context, databases, userId, starId) {
    try {
        const star = await databases.getDocument(
            config.databaseId,
            config.collections.stars,
            starId
        );

        if (star.userId !== userId) {
            return error(context, 'FORBIDDEN', 'Access denied', 403);
        }

        await databases.deleteDocument(
            config.databaseId,
            config.collections.stars,
            starId
        );

        return success(context, { deleted: true });
    } catch (err) {
        if (err?.code === 404) {
            return notFound(context, 'Star not found');
        }
        context.error(`Unstar item error: ${err}`);
        return serverError(context);
    }
}

 
async function unstarByResource(context, databases, userId) {
    const input = parseBody(context);

    if (!input || !input.resourceType || !input.resourceId) {
        return error(context, 'INVALID_INPUT', 'resourceType and resourceId required');
    }

    try {
        const existing = await databases.listDocuments(
            config.databaseId,
            config.collections.stars,
            [
                Query.equal('userId', userId),
                Query.equal('resourceType', input.resourceType),
                Query.equal('resourceId', input.resourceId),
                Query.limit(1),
            ]
        );

        if (existing.total === 0) {
            return notFound(context, 'Item is not starred');
        }

        await databases.deleteDocument(
            config.databaseId,
            config.collections.stars,
            existing.documents[0].$id
        );

        return success(context, { deleted: true });
    } catch (err) {
        context.error(`Unstar by resource error: ${err}`);
        return serverError(context);
    }
}

 
async function checkStarred(context, databases, userId, resourceType, resourceId) {
    try {
        const existing = await databases.listDocuments(
            config.databaseId,
            config.collections.stars,
            [
                Query.equal('userId', userId),
                Query.equal('resourceType', resourceType),
                Query.equal('resourceId', resourceId),
                Query.limit(1),
            ]
        );

        return success(context, {
            isStarred: existing.total > 0,
            starId: existing.total > 0 ? existing.documents[0].$id : null,
        });
    } catch (err) {
        context.error(`Check starred error: ${err}`);
        return serverError(context);
    }
}





 
export default async function main(context) {
    const userId = getUserId(context);

    if (!userId) {
        return unauthorized(context);
    }

    const client = getClient(context);
    const databases = new Databases(client);

    const { method, path, query } = context.req;
    const pathParts = path.split('/').filter(Boolean);

    context.log(`Manage Stars: ${method} ${path}`);

    try {
        switch (method) {
            case 'GET': {
                
                if (query.resourceType && query.resourceId) {
                    return checkStarred(context, databases, userId, query.resourceType, query.resourceId);
                }
                
                return listStars(context, databases, userId);
            }

            case 'POST': {
                
                if (pathParts.length === 1 && pathParts[0] === 'unstar') {
                    return unstarByResource(context, databases, userId);
                }
                
                return starItem(context, databases, userId);
            }

            case 'DELETE': {
                if (pathParts.length !== 1) {
                    return error(context, 'INVALID_INPUT', 'Star ID required');
                }
                return unstarItem(context, databases, userId, pathParts[0]);
            }

            default:
                return error(context, 'METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
    } catch (err) {
        context.error(`Unhandled error: ${err}`);
        return serverError(context);
    }
}

