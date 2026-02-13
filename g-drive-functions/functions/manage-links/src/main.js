 

import { Client, Databases, Storage, Query, ID, Permission, Role } from 'node-appwrite';





 

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

 
function forbidden(context, message = 'Forbidden') {
    return error(context, 'FORBIDDEN', message, 403);
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

 
function generateToken(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charsLength = chars.length;
    
    
    
    const maxByte = Math.floor(256 / charsLength) * charsLength;
    
    let result = '';
    while (result.length < length) {
        const randomByte = new Uint8Array(1);
        crypto.getRandomValues(randomByte);
        
        
        if (randomByte[0] < maxByte) {
            result += chars.charAt(randomByte[0] % charsLength);
        }
    }
    
    return result;
}

 
async function hashPassword(password) {
    
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iterations = 100000; 
    
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits']
    );
    
    
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: iterations,
            hash: 'SHA-256'
        },
        passwordKey,
        256 
    );
    
    
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    
    return `${iterations}:${saltHex}:${hashHex}`;
}

 
async function verifyPassword(password, storedHash) {
    const [iterationsStr, saltHex, storedHashHex] = storedHash.split(':');
    const iterations = parseInt(iterationsStr, 10);
    
    
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits']
    );
    
    
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: iterations,
            hash: 'SHA-256'
        },
        passwordKey,
        256 
    );
    
    
    const computedHashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    
    if (computedHashHex.length !== storedHashHex.length) {
        return false;
    }
    let result = 0;
    for (let i = 0; i < computedHashHex.length; i++) {
        result |= computedHashHex.charCodeAt(i) ^ storedHashHex.charCodeAt(i);
    }
    return result === 0;
}





const config = getEnvConfig();

 
function getClient(context) {
    return new Client()
        .setEndpoint(requireEnv('APPWRITE_FUNCTION_API_ENDPOINT'))
        .setProject(requireEnv('APPWRITE_FUNCTION_PROJECT_ID'))
        .setKey(process.env.APPWRITE_API_KEY || context.req.headers['x-appwrite-key'] || '');
}





 
async function verifyOwnership(databases, resourceType, resourceId, userId) {
    try {
        const collection = resourceType === 'file'
            ? config.collections.files
            : config.collections.folders;

        const doc = await databases.getDocument(
            config.databaseId,
            collection,
            resourceId
        );

        return doc.ownerId === userId;
    } catch {
        return false;
    }
}





 
async function getLink(context, databases, userId, resourceType, resourceId) {
    try {
        
        const isOwner = await verifyOwnership(
            databases,
            resourceType,
            resourceId,
            userId
        );

        if (!isOwner) {
            return forbidden(context, 'Only the owner can view link');
        }

        const result = await databases.listDocuments(
            config.databaseId,
            config.collections.linkShares,
            [
                Query.equal('resourceType', resourceType),
                Query.equal('resourceId', resourceId),
                Query.limit(1),
            ]
        );

        if (result.total === 0) {
            return success(context, null);
        }

        const link = result.documents[0];

        return success(context, {
            ...link,
            url: `${requireEnv('FRONTEND_URL')}/s/${link.token}`,
            passwordProtected: !!link.passwordHash,
        });
    } catch (err) {
        context.error(`Get link error: ${err}`);
        return serverError(context);
    }
}

 
async function createLink(context, databases, userId) {
    const input = parseBody(context);

    if (!input || !input.resourceType || !input.resourceId) {
        return error(context, 'INVALID_INPUT', 'Missing required fields');
    }

    try {
        
        const isOwner = await verifyOwnership(
            databases,
            input.resourceType,
            input.resourceId,
            userId
        );

        if (!isOwner) {
            return forbidden(context, 'Only the owner can create a link');
        }

        
        const existing = await databases.listDocuments(
            config.databaseId,
            config.collections.linkShares,
            [
                Query.equal('resourceType', input.resourceType),
                Query.equal('resourceId', input.resourceId),
            ]
        );

        for (const doc of existing.documents) {
            await databases.deleteDocument(
                config.databaseId,
                config.collections.linkShares,
                doc.$id
            );
        }

        
        const token = generateToken(32);

        
        let passwordHash = null;
        if (input.password) {
            passwordHash = await hashPassword(input.password);
        }

        
        const link = await databases.createDocument(
            config.databaseId,
            config.collections.linkShares,
            ID.unique(),
            {
                resourceType: input.resourceType,
                resourceId: input.resourceId,
                token,
                role: 'viewer',
                passwordHash,
                expiresAt: input.expiresAt || null,
                createdBy: userId,
            },
            [
                Permission.read(Role.any()),
                Permission.update(Role.user(userId)),
                Permission.delete(Role.user(userId)),
            ]
        );

        return success(context, {
            ...link,
            url: `${requireEnv('FRONTEND_URL')}/s/${token}`,
            passwordProtected: !!passwordHash,
        }, 201);
    } catch (err) {
        context.error(`Create link error: ${err}`);
        return serverError(context);
    }
}

 
async function resolveLink(context, databases, storage, token) {
    const input = parseBody(context);

    try {
        const result = await databases.listDocuments(
            config.databaseId,
            config.collections.linkShares,
            [Query.equal('token', token), Query.limit(1)]
        );

        if (result.total === 0) {
            return notFound(context, 'Link not found');
        }

        const link = result.documents[0];

        
        if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
            return error(context, 'LINK_EXPIRED', 'This link has expired', 410);
        }

        
        if (link.passwordHash) {
            if (!input?.password) {
                return error(context, 'PASSWORD_REQUIRED', 'This link is password protected');
            }

            const validPassword = await verifyPassword(input.password, link.passwordHash);
            if (!validPassword) {
                return error(context, 'INVALID_PASSWORD', 'Incorrect password', 401);
            }
        }

        
        const collection = link.resourceType === 'file'
            ? config.collections.files
            : config.collections.folders;

        const resource = await databases.getDocument(
            config.databaseId,
            collection,
            link.resourceId
        );

        
        let downloadUrl;
        let viewUrl;
        if (link.resourceType === 'file') {
            downloadUrl = storage.getFileDownload(
                config.buckets.userFiles,
                resource.storageKey
            ).toString();
            
            viewUrl = storage.getFileView(
                config.buckets.userFiles,
                resource.storageKey
            ).toString();
        }

        return success(context, {
            link,
            resource,
            downloadUrl,
            viewUrl,
        });
    } catch (err) {
        if (err?.code === 404) {
            return notFound(context, 'Resource not found');
        }
        context.error(`Resolve link error: ${err}`);
        return serverError(context);
    }
}

 
async function deleteLink(context, databases, userId, linkId) {
    try {
        const link = await databases.getDocument(
            config.databaseId,
            config.collections.linkShares,
            linkId
        );

        if (link.createdBy !== userId) {
            return forbidden(context, 'Only the owner can delete this link');
        }

        await databases.deleteDocument(
            config.databaseId,
            config.collections.linkShares,
            linkId
        );

        return success(context, { deleted: true });
    } catch (err) {
        if (err?.code === 404) {
            return notFound(context, 'Link not found');
        }
        context.error(`Delete link error: ${err}`);
        return serverError(context);
    }
}





 
export default async function main(context) {
    const client = getClient(context);
    const databases = new Databases(client);
    const storage = new Storage(client);

    const { method, path, query } = context.req;
    const pathParts = path.split('/').filter(Boolean);

    context.log(`Manage Links: ${method} ${path}`);

    try {
        
        if (method === 'POST' && pathParts.length === 1 && pathParts[0] !== 'create') {
            return resolveLink(context, databases, storage, pathParts[0]);
        }

        
        const userId = getUserId(context);
        if (!userId) {
            return unauthorized(context);
        }

        switch (method) {
            case 'GET': {
                if (!query.resourceType || !query.resourceId) {
                    return error(context, 'INVALID_INPUT', 'resourceType and resourceId required');
                }
                return getLink(context, databases, userId, query.resourceType, query.resourceId);
            }

            case 'POST': {
                return createLink(context, databases, userId);
            }

            case 'DELETE': {
                if (pathParts.length !== 1) {
                    return error(context, 'INVALID_INPUT', 'Link ID required');
                }
                return deleteLink(context, databases, userId, pathParts[0]);
            }

            default:
                return error(context, 'METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
    } catch (err) {
        context.error(`Unhandled error: ${err}`);
        return serverError(context);
    }
}

