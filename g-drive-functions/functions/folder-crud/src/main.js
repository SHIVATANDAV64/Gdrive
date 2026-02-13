

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
    return context.res.json(response, status, context.responseHeaders || {});
}


function error(context, code, message, status = 400) {
    const response = { success: false, error: { code, message } };
    return context.res.json(response, status, context.responseHeaders || {});
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


function isNotEmpty(value) {
    return typeof value === 'string' && value.trim().length > 0;
}


function isValidFolderName(name) {
    if (!isNotEmpty(name)) return false;
    if (name.length > 255) return false;


    let decodedName = name;
    try {

        decodedName = decodeURIComponent(name);

        if (decodedName !== name) {
            const doubleDecoded = decodeURIComponent(decodedName);
            if (doubleDecoded !== decodedName) {
                decodedName = doubleDecoded;
            }
        }
    } catch {

        decodedName = name;
    }


    if (/[/\\<>:"|?*\x00-\x1f]/.test(name) || /[/\\<>:"|?*\x00-\x1f]/.test(decodedName)) {
        return false;
    }


    if (decodedName.includes('..') || name.includes('..')) return false;
    if (/\.\./.test(decodedName) || /\.\./.test(name)) return false;


    if (decodedName.startsWith('.') || decodedName.endsWith('.')) return false;
    if (decodedName.trim() !== decodedName) return false;

    return true;
}


function isValidId(value) {
    if (typeof value !== 'string') return false;


    return /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,35}$/.test(value);
}


async function wouldCreateCycle(databases, folderId, targetParentId) {
    if (!targetParentId) return false;
    if (targetParentId === folderId) return true;

    const MAX_DEPTH = 1000;
    let currentId = targetParentId;
    const visited = new Set();
    let depth = 0;


    while (currentId) {
        depth++;


        if (depth > MAX_DEPTH) {
            throw new Error('Folder hierarchy exceeds maximum depth - possible corruption detected');
        }


        if (visited.has(currentId)) {
            throw new Error('Circular reference detected in existing folder hierarchy - data corruption');
        }

        visited.add(currentId);


        if (currentId === folderId) return true;

        try {
            const folder = await databases.getDocument(
                config.databaseId,
                config.collections.folders,
                currentId
            );
            currentId = folder.parentId;
        } catch {

            break;
        }
    }

    return false;
}


async function checkInheritedShareAccess(databases, config, resourceType, resourceId, userId, requiredRole = 'viewer') {
    const checkedFolders = new Set();
    let currentId = resourceId;

    while (currentId) {
        // 1. Check direct share on this folder
        const shares = await databases.listDocuments(
            config.databaseId,
            config.collections.shares,
            [
                Query.equal('resourceType', 'folder'),
                Query.equal('resourceId', currentId),
                Query.equal('granteeUserId', userId),
            ]
        );

        if (shares.total > 0) {
            const role = shares.documents[0].role;
            if (requiredRole === 'viewer' || role === 'editor') {
                return { allowed: true, role };
            }
        }

        // 2. Move up to parent
        if (checkedFolders.has(currentId)) break;
        checkedFolders.add(currentId);

        try {
            const folder = await databases.getDocument(config.databaseId, config.collections.folders, currentId);
            if (folder.ownerId === userId) return { allowed: true, role: 'owner' };
            currentId = folder.parentId;
        } catch {
            break;
        }
    }

    return { allowed: false };
}





const config = getEnvConfig();


function getClient(context) {
    return new Client()
        .setEndpoint(requireEnv('APPWRITE_FUNCTION_API_ENDPOINT'))
        .setProject(requireEnv('APPWRITE_FUNCTION_PROJECT_ID'))
        .setKey(process.env.APPWRITE_API_KEY || context.req.headers['x-appwrite-key'] || '');
}






async function logActivity(databases, actorId, action, resourceType, resourceId, context = {}) {
    try {
        await databases.createDocument(
            config.databaseId,
            config.collections.activities,
            ID.unique(),
            {
                actorId,
                action,
                resourceType,
                resourceId,
                context: JSON.stringify(context),
            }
        );
    } catch (err) {

        console.error('Failed to log activity:', err.message);
    }
}






async function listFolders(context, databases, userId, parentId) {
    try {

        const ownedQueries = [
            Query.equal('ownerId', userId),
            Query.equal('isDeleted', false),
            Query.orderAsc('name'),
        ];

        if (parentId) {
            ownedQueries.push(Query.equal('parentId', parentId));
        } else {
            ownedQueries.push(Query.isNull('parentId'));
        }

        const ownedResult = await databases.listDocuments(
            config.databaseId,
            config.collections.folders,
            ownedQueries
        );


        let sharedFolders = [];
        try {

            const shares = await databases.listDocuments(
                config.databaseId,
                config.collections.shares,
                [
                    Query.equal('resourceType', 'folder'),
                    Query.equal('granteeUserId', userId),
                ]
            );

            if (shares.total > 0) {

                const sharedFolderIds = shares.documents.map(s => s.resourceId);


                for (const folderId of sharedFolderIds) {
                    try {
                        const folder = await databases.getDocument(
                            config.databaseId,
                            config.collections.folders,
                            folderId
                        );


                        if (!folder.isDeleted) {


                            const matchesParent = parentId
                                ? folder.parentId === parentId
                                : folder.parentId === null;

                            if (matchesParent) {

                                const shareInfo = shares.documents.find(s => s.resourceId === folderId);
                                folder._sharedWithMe = true;
                                folder._shareRole = shareInfo?.role || 'viewer';
                                sharedFolders.push(folder);
                            }
                        }
                    } catch {

                    }
                }
            }
        } catch (err) {

            context.log(`Could not fetch shared folders: ${err.message}`);
        }


        const allFolders = [...ownedResult.documents];
        for (const sharedFolder of sharedFolders) {
            if (!allFolders.some(f => f.$id === sharedFolder.$id)) {
                allFolders.push(sharedFolder);
            }
        }


        allFolders.sort((a, b) => a.name.localeCompare(b.name));

        return success(context, {
            folders: allFolders,
            total: allFolders.length,
        });
    } catch (err) {
        context.error(`List folders error: ${err}`);
        return serverError(context, `Failed to list folders: ${err.message || err}`);
    }
}


async function getFolder(context, databases, userId, folderId) {
    try {
        const folder = await databases.getDocument(
            config.databaseId,
            config.collections.folders,
            folderId
        );

        if (folder.ownerId !== userId) {

            const shareAccess = await checkInheritedShareAccess(databases, config, 'folder', folderId, userId, 'viewer');
            if (!shareAccess.allowed) {
                return forbidden(context, 'You do not have access to this folder');
            }
        }

        if (folder.isDeleted) {
            return notFound(context, 'Folder not found');
        }

        return success(context, folder);
    } catch (err) {
        if (err?.code === 404) {
            return notFound(context, 'Folder not found');
        }
        context.error(`Get folder error: ${err}`);
        return serverError(context, `Failed to get folder: ${err.message || err}`);
    }
}


async function getFolderPath(context, databases, userId, folderId) {
    try {
        const path = [];
        let currentId = folderId;

        while (currentId) {
            const folder = await databases.getDocument(
                config.databaseId,
                config.collections.folders,
                currentId
            );

            if (folder.ownerId !== userId) {
                return forbidden(context, 'Access denied');
            }

            path.unshift(folder);
            currentId = folder.parentId;
        }

        return success(context, path);
    } catch (err) {
        if (err?.code === 404) {
            return notFound(context, 'Folder not found');
        }
        context.error(`Get folder path error: ${err}`);
        return serverError(context, `Failed to get folder path: ${err.message || err}`);
    }
}


async function createFolder(context, databases, userId) {
    const input = parseBody(context);

    if (!input || !input.name) {
        return error(context, 'INVALID_INPUT', 'Folder name is required');
    }

    if (!isValidFolderName(input.name)) {
        return error(context, 'INVALID_INPUT', 'Invalid folder name');
    }

    try {

        if (input.parentId) {
            if (!isValidId(input.parentId)) {
                return error(context, 'INVALID_INPUT', 'Invalid parent folder ID format');
            }

            const parent = await databases.getDocument(
                config.databaseId,
                config.collections.folders,
                input.parentId
            );

            if (parent.ownerId !== userId) {
                return forbidden(context, 'Access denied to parent folder');
            }
        }


        const existing = await databases.listDocuments(
            config.databaseId,
            config.collections.folders,
            [
                Query.equal('ownerId', userId),
                Query.equal('name', input.name),
                Query.equal('isDeleted', false),
                input.parentId
                    ? Query.equal('parentId', input.parentId)
                    : Query.isNull('parentId'),
            ]
        );

        if (existing.total > 0) {
            return error(context, 'ALREADY_EXISTS', 'A folder with this name already exists');
        }


        const folder = await databases.createDocument(
            config.databaseId,
            config.collections.folders,
            ID.unique(),
            {
                name: input.name,
                ownerId: userId,
                parentId: input.parentId ?? null,
                isDeleted: false,
            },
            [
                Permission.read(Role.user(userId)),
                Permission.update(Role.user(userId)),
                Permission.delete(Role.user(userId)),
            ]
        );


        await logActivity(databases, userId, 'create', 'folder', folder.$id, {
            name: folder.name,
            parentId: folder.parentId,
        });

        return success(context, folder, 201);
    } catch (err) {
        context.error(`Create folder error: ${err}`);
        return serverError(context, `Failed to create folder: ${err.message || err}`);
    }
}


async function updateFolder(context, databases, userId, folderId) {
    const input = parseBody(context);

    if (!input) {
        return error(context, 'INVALID_INPUT', 'No update data provided');
    }

    try {

        const folder = await databases.getDocument(
            config.databaseId,
            config.collections.folders,
            folderId
        );

        if (folder.ownerId !== userId) {

            const shareAccess = await checkInheritedShareAccess(databases, config, 'folder', folderId, userId, 'editor');
            if (!shareAccess.allowed) {
                return forbidden(context, 'Access denied - editor permission required');
            }
        }

        if (folder.isDeleted) {
            return notFound(context, 'Folder not found');
        }

        const updates = {};


        if (input.name !== undefined) {
            if (!isValidFolderName(input.name)) {
                return error(context, 'INVALID_INPUT', 'Invalid folder name');
            }
            updates.name = input.name;
        }


        if (input.parentId !== undefined) {

            if (input.parentId !== null && !isValidId(input.parentId)) {
                return error(context, 'INVALID_INPUT', 'Invalid parent folder ID format');
            }


            if (input.parentId === folderId) {
                return error(context, 'INVALID_INPUT', 'Cannot move folder into itself');
            }


            if (await wouldCreateCycle(databases, folderId, input.parentId)) {
                return error(context, 'INVALID_INPUT', 'Cannot move folder into one of its subfolders');
            }


            if (input.parentId !== null) {
                const newParent = await databases.getDocument(
                    config.databaseId,
                    config.collections.folders,
                    input.parentId
                );

                if (newParent.ownerId !== userId) {
                    return forbidden(context, 'Access denied to destination folder');
                }

                if (newParent.isDeleted) {
                    return error(context, 'INVALID_INPUT', 'Cannot move to a deleted folder');
                }
            }

            updates.parentId = input.parentId;
        }

        if (input.isDeleted !== undefined) {
            updates.isDeleted = input.isDeleted;
        }

        if (Object.keys(updates).length === 0) {
            return success(context, folder);
        }

        const updated = await databases.updateDocument(
            config.databaseId,
            config.collections.folders,
            folderId,
            updates
        );


        const action = updates.name ? 'rename' : (updates.parentId !== undefined ? 'move' : 'rename');
        await logActivity(databases, userId, action, 'folder', folderId, {
            oldName: folder.name,
            newName: updates.name || folder.name,
            oldParentId: folder.parentId,
            newParentId: updates.parentId !== undefined ? updates.parentId : folder.parentId,
        });

        return success(context, updated);
    } catch (err) {
        if (err?.code === 404) {
            return notFound(context, 'Folder not found');
        }
        context.error(`Update folder error: ${err}`);
        return serverError(context, `Failed to update folder: ${err.message || err}`);
    }
}


async function deleteFolder(context, databases, userId, folderId) {
    try {
        const folder = await databases.getDocument(
            config.databaseId,
            config.collections.folders,
            folderId
        );

        if (folder.ownerId !== userId) {

            const shareAccess = await checkInheritedShareAccess(databases, config, 'folder', folderId, userId, 'editor');
            if (!shareAccess.allowed) {
                return forbidden(context, 'Access denied - editor permission required');
            }
        }

        if (folder.isDeleted) {
            return notFound(context, 'Folder not found');
        }


        await databases.updateDocument(
            config.databaseId,
            config.collections.folders,
            folderId,
            { isDeleted: true }
        );


        await logActivity(databases, userId, 'delete', 'folder', folderId, {
            name: folder.name,
            parentId: folder.parentId,
        });

        return success(context, { deleted: true });
    } catch (err) {
        if (err?.code === 404) {
            return notFound(context, 'Folder not found');
        }
        context.error(`Delete folder error: ${err}`);
        return serverError(context, `Failed to delete folder: ${err.message || err}`);
    }
}





const RATE_LIMIT = {
    windowMs: 60 * 1000,
    maxRequests: 100,
};




async function checkRateLimit(databases, userId) {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT.windowMs;
    const rateLimitCollectionId = requireEnv('COLLECTION_RATE_LIMITS');

    try {

        const records = await databases.listDocuments(
            config.databaseId,
            rateLimitCollectionId,
            [
                Query.equal('userId', userId),
                Query.greaterThan('timestamp', windowStart.toString()),
                Query.limit(101),
            ]
        );

        const requestCount = records.total;
        const remaining = Math.max(0, RATE_LIMIT.maxRequests - requestCount);
        const resetTime = Math.ceil((now + RATE_LIMIT.windowMs) / 1000);

        if (requestCount >= RATE_LIMIT.maxRequests) {
            return { allowed: false, remaining: 0, resetTime };
        }


        try {
            await databases.createDocument(
                config.databaseId,
                rateLimitCollectionId,
                ID.unique(),
                {
                    userId,
                    timestamp: now.toString(),
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(now + RATE_LIMIT.windowMs).toISOString(),
                }
            );
        } catch (recordErr) {

            console.warn('Failed to record rate limit:', recordErr.message);
        }



        if (Math.random() < 0.1) {
            cleanupExpiredRateLimitRecords(databases, rateLimitCollectionId, windowStart).catch(err => {
                console.warn('Rate limit cleanup failed:', err.message);
            });
        }

        return { allowed: true, remaining: remaining - 1, resetTime };
    } catch (err) {

        console.warn('Rate limit check failed, allowing request:', err.message);
        return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1, resetTime: Math.ceil((now + RATE_LIMIT.windowMs) / 1000) };
    }
}


async function cleanupExpiredRateLimitRecords(databases, rateLimitCollectionId, windowStart) {
    try {

        const expiredRecords = await databases.listDocuments(
            config.databaseId,
            rateLimitCollectionId,
            [
                Query.lessThanOrEqual('timestamp', windowStart.toString()),
                Query.limit(500),
            ]
        );


        for (const record of expiredRecords.documents) {
            try {
                await databases.deleteDocument(
                    config.databaseId,
                    rateLimitCollectionId,
                    record.$id
                );
            } catch {

            }
        }

        console.log(`Rate limit cleanup: deleted ${expiredRecords.documents.length} expired records`);
    } catch (err) {

        console.warn('Failed to cleanup rate limit records:', err.message);
    }
}






export default async function main(context) {
    const userId = getUserId(context);

    if (!userId) {
        return unauthorized(context);
    }

    const client = getClient(context);
    const databases = new Databases(client);


    const rateLimitResult = await checkRateLimit(databases, userId);


    context.responseHeaders = {
        'X-RateLimit-Limit': RATE_LIMIT.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
    };

    if (!rateLimitResult.allowed) {
        return error(
            context,
            'RATE_LIMIT_EXCEEDED',
            `Too many requests. Please try again in ${Math.ceil((rateLimitResult.resetTime * 1000 - Date.now()) / 1000)} seconds.`,
            429
        );
    }

    const { method, path, query } = context.req;
    const pathParts = path.split('/').filter(Boolean);

    context.log(`Folder CRUD: ${method} ${path}`);

    try {
        switch (method) {
            case 'GET': {
                if (pathParts.length === 0) {

                    const parentId = query.parentId || null;
                    return listFolders(context, databases, userId, parentId);
                } else if (pathParts.length === 1) {

                    return getFolder(context, databases, userId, pathParts[0]);
                } else if (pathParts.length === 2 && pathParts[1] === 'path') {

                    return getFolderPath(context, databases, userId, pathParts[0]);
                }
                return notFound(context, 'Invalid endpoint');
            }

            case 'POST': {
                return createFolder(context, databases, userId);
            }

            case 'PATCH': {
                if (pathParts.length !== 1) {
                    return error(context, 'INVALID_INPUT', 'Folder ID required');
                }
                return updateFolder(context, databases, userId, pathParts[0]);
            }

            case 'DELETE': {
                if (pathParts.length !== 1) {
                    return error(context, 'INVALID_INPUT', 'Folder ID required');
                }
                return deleteFolder(context, databases, userId, pathParts[0]);
            }

            default:
                return error(context, 'METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
    } catch (err) {
        context.error(`Unhandled error: ${err}`);
        return serverError(context, `Unhandled error: ${err.message || err}`);
    }
}

