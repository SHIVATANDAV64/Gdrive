 

import { Client, Databases, Storage, Query, ID } from 'node-appwrite';





 

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





 
async function listTrash(context, databases, userId) {
    try {
        
        const filesResult = await databases.listDocuments(
            config.databaseId,
            config.collections.files,
            [
                Query.equal('ownerId', userId),
                Query.equal('isDeleted', true),
                Query.orderDesc('$updatedAt'),
                Query.limit(100),
            ]
        );

        
        const foldersResult = await databases.listDocuments(
            config.databaseId,
            config.collections.folders,
            [
                Query.equal('ownerId', userId),
                Query.equal('isDeleted', true),
                Query.orderDesc('$updatedAt'),
                Query.limit(100),
            ]
        );

        const files = filesResult.documents.map((f) => ({
            ...f,
            resourceType: 'file',
        }));

        const folders = foldersResult.documents.map((f) => ({
            ...f,
            resourceType: 'folder',
        }));

        return success(context, {
            items: [...folders, ...files],
            total: files.length + folders.length,
        });
    } catch (err) {
        context.error(`List trash error: ${err}`);
        return serverError(context);
    }
}

 
async function restoreItem(context, databases, userId) {
    const input = parseBody(context);

    if (!input || !input.resourceType || !input.resourceId) {
        return error(context, 'INVALID_INPUT', 'resourceType and resourceId required');
    }

    try {
        const collection = input.resourceType === 'file'
            ? config.collections.files
            : config.collections.folders;

        const doc = await databases.getDocument(
            config.databaseId,
            collection,
            input.resourceId
        );

        if (doc.ownerId !== userId) {
            return forbidden(context, 'Access denied');
        }

        if (!doc.isDeleted) {
            return error(context, 'INVALID_INPUT', 'Item is not in trash');
        }

        await databases.updateDocument(
            config.databaseId,
            collection,
            input.resourceId,
            { isDeleted: false }
        );

        
        await logActivity(databases, userId, 'restore', input.resourceType, input.resourceId, {
            name: doc.name,
        });

        return success(context, { restored: true });
    } catch (err) {
        if (err?.code === 404) {
            return notFound(context, 'Item not found');
        }
        context.error(`Restore item error: ${err}`);
        return serverError(context);
    }
}

 
async function permanentDelete(context, databases, storage, userId, resourceType, resourceId) {
    try {
        const collection = resourceType === 'file'
            ? config.collections.files
            : config.collections.folders;

        const doc = await databases.getDocument(
            config.databaseId,
            collection,
            resourceId
        );

        
        if (doc.ownerId !== userId) {
            return forbidden(context, 'Access denied');
        }

        if (!doc.isDeleted) {
            return error(context, 'INVALID_INPUT', 'Item must be in trash to permanently delete');
        }

        
        if (resourceType === 'file') {
            try {
                await storage.deleteFile(config.buckets.userFiles, doc.storageKey);
            } catch {
                
                context.log(`Storage file not found: ${doc.storageKey}`);
            }
        }

        
        if (resourceType === 'folder') {
            await deleteNestedContentsRecursively(context, databases, storage, resourceId, userId);
        }

        
        
        await deleteRelatedRecords(databases, resourceType, resourceId);

        
        await databases.deleteDocument(config.databaseId, collection, resourceId);

        
        await logActivity(databases, userId, 'permanent_delete', resourceType, resourceId, {
            name: doc.name,
        });

        return success(context, { deleted: true });
    } catch (err) {
        if (err?.code === 404) {
            return notFound(context, 'Item not found');
        }
        context.error(`Permanent delete error: ${err}`);
        return serverError(context);
    }
}

 
async function deleteNestedContentsRecursively(context, databases, storage, folderId, userId) {
    
    const nestedFiles = await databases.listDocuments(
        config.databaseId,
        config.collections.files,
        [Query.equal('folderId', folderId), Query.limit(500)]
    );

    for (const file of nestedFiles.documents) {
        
        if (file.ownerId !== userId) {
            context.log(`Skipping file ${file.$id} - not owned by user`);
            continue;
        }
        try {
            await storage.deleteFile(config.buckets.userFiles, file.storageKey);
        } catch {
            
        }
        await databases.deleteDocument(config.databaseId, config.collections.files, file.$id);
        
        await deleteRelatedRecords(databases, 'file', file.$id);
    }

    
    const nestedFolders = await databases.listDocuments(
        config.databaseId,
        config.collections.folders,
        [Query.equal('parentId', folderId), Query.limit(500)]
    );

    for (const folder of nestedFolders.documents) {
        
        if (folder.ownerId !== userId) {
            context.log(`Skipping folder ${folder.$id} - not owned by user`);
            continue;
        }
        
        await deleteNestedContentsRecursively(context, databases, storage, folder.$id, userId);
        
        await databases.deleteDocument(config.databaseId, config.collections.folders, folder.$id);
        
        await deleteRelatedRecords(databases, 'folder', folder.$id);
    }
}

 
async function deleteRelatedRecords(databases, resourceType, resourceId) {
    
    try {
        const shares = await databases.listDocuments(
            config.databaseId,
            config.collections.shares,
            [
                Query.equal('resourceType', resourceType),
                Query.equal('resourceId', resourceId),
                Query.limit(100),
            ]
        );
        for (const share of shares.documents) {
            await databases.deleteDocument(config.databaseId, config.collections.shares, share.$id);
        }
    } catch {
        
    }

    
    try {
        const linkShares = await databases.listDocuments(
            config.databaseId,
            config.collections.linkShares,
            [
                Query.equal('resourceType', resourceType),
                Query.equal('resourceId', resourceId),
                Query.limit(100),
            ]
        );
        for (const link of linkShares.documents) {
            await databases.deleteDocument(config.databaseId, config.collections.linkShares, link.$id);
        }
    } catch {
        
    }

    
    try {
        const stars = await databases.listDocuments(
            config.databaseId,
            config.collections.stars,
            [
                Query.equal('resourceType', resourceType),
                Query.equal('resourceId', resourceId),
                Query.limit(100),
            ]
        );
        for (const star of stars.documents) {
            await databases.deleteDocument(config.databaseId, config.collections.stars, star.$id);
        }
    } catch {
        
    }
}

 
async function emptyTrash(context, databases, storage, userId) {
    try {
        
        const filesResult = await databases.listDocuments(
            config.databaseId,
            config.collections.files,
            [
                Query.equal('ownerId', userId),
                Query.equal('isDeleted', true),
                Query.limit(500),
            ]
        );

        for (const file of filesResult.documents) {
            try {
                await storage.deleteFile(config.buckets.userFiles, file.storageKey);
            } catch {
                
            }
            await databases.deleteDocument(config.databaseId, config.collections.files, file.$id);
        }

        
        const foldersResult = await databases.listDocuments(
            config.databaseId,
            config.collections.folders,
            [
                Query.equal('ownerId', userId),
                Query.equal('isDeleted', true),
                Query.limit(500),
            ]
        );

        for (const folder of foldersResult.documents) {
            await databases.deleteDocument(config.databaseId, config.collections.folders, folder.$id);
        }

        
        await logActivity(databases, userId, 'empty_trash', 'system', 'trash', {
            filesDeleted: filesResult.documents.length,
            foldersDeleted: foldersResult.documents.length,
        });

        return success(context, {
            deleted: {
                files: filesResult.documents.length,
                folders: foldersResult.documents.length,
            },
        });
    } catch (err) {
        context.error(`Empty trash error: ${err}`);
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
    const storage = new Storage(client);

    const { method, path, query } = context.req;
    const pathParts = path.split('/').filter(Boolean);

    context.log(`Manage Trash: ${method} ${path}`);

    try {
        switch (method) {
            case 'GET': {
                return listTrash(context, databases, userId);
            }

            case 'POST': {
                if (pathParts.length === 1 && pathParts[0] === 'restore') {
                    return restoreItem(context, databases, userId);
                }
                if (pathParts.length === 1 && pathParts[0] === 'empty') {
                    return emptyTrash(context, databases, storage, userId);
                }
                return error(context, 'INVALID_INPUT', 'Invalid action');
            }

            case 'DELETE': {
                if (!query.resourceType || !query.resourceId) {
                    return error(context, 'INVALID_INPUT', 'resourceType and resourceId required');
                }
                return permanentDelete(
                    context,
                    databases,
                    storage,
                    userId,
                    query.resourceType,
                    query.resourceId
                );
            }

            default:
                return error(context, 'METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
    } catch (err) {
        context.error(`Unhandled error: ${err}`);
        return serverError(context);
    }
}

