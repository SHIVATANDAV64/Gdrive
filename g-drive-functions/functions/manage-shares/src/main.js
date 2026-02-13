 

import { Client, Databases, Query, ID, Permission, Role, Storage } from 'node-appwrite';





 

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

 
async function findUserByEmail(databases, email) {
    try {
        const result = await databases.listDocuments(
            config.databaseId,
            config.collections.users,
            [Query.equal('email', email), Query.limit(1)]
        );

        if (result.total === 0) return null;
        return result.documents[0].$id;
    } catch {
        return null;
    }
}





 
async function listShares(context, databases, userId, resourceType, resourceId) {
    try {
        
        const isOwner = await verifyOwnership(
            databases,
            resourceType,
            resourceId,
            userId
        );

        if (!isOwner) {
            return forbidden(context, 'Only the owner can view shares');
        }

        const result = await databases.listDocuments(
            config.databaseId,
            config.collections.shares,
            [
                Query.equal('resourceType', resourceType),
                Query.equal('resourceId', resourceId),
            ]
        );

        return success(context, {
            shares: result.documents,
            total: result.total,
        });
    } catch (err) {
        context.error(`List shares error: ${err}`);
        return serverError(context);
    }
}

 
async function getSharedWithMe(context, databases, userId) {
    try {
        const result = await databases.listDocuments(
            config.databaseId,
            config.collections.shares,
            [Query.equal('granteeUserId', userId)]
        );

        // Fetch the actual resource details for each share
        const sharesWithResources = await Promise.all(
            result.documents.map(async (share) => {
                try {
                    const collection = share.resourceType === 'file'
                        ? config.collections.files
                        : config.collections.folders;

                    const resource = await databases.getDocument(
                        config.databaseId,
                        collection,
                        share.resourceId
                    );

                    return {
                        ...share,
                        resource: {
                            $id: resource.$id,
                            name: resource.name,
                            mimeType: resource.mimeType || null,
                            sizeBytes: resource.sizeBytes || null,
                            storageKey: resource.storageKey || null,
                            ownerId: resource.ownerId,
                        },
                    };
                } catch (err) {
                    // Resource might have been deleted
                    context.log(`Could not fetch resource ${share.resourceId}: ${err.message}`);
                    return {
                        ...share,
                        resource: null,
                    };
                }
            })
        );

        // Filter out shares where the resource no longer exists
        const validShares = sharesWithResources.filter(share => share.resource !== null);

        return success(context, {
            shares: validShares,
            total: validShares.length,
        });
    } catch (err) {
        context.error(`Get shared with me error: ${err}`);
        return serverError(context);
    }
}

 
async function createShare(context, databases, userId, storage) {
    const input = parseBody(context);

    if (!input || !input.resourceType || !input.resourceId || !input.granteeEmail) {
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
            return forbidden(context, 'Only the owner can share this resource');
        }

        
        const granteeId = await findUserByEmail(databases, input.granteeEmail);

        if (!granteeId) {
            return error(context, 'USER_NOT_FOUND', 'User not found with that email');
        }

        
        if (granteeId === userId) {
            return error(context, 'INVALID_INPUT', 'Cannot share with yourself');
        }

        
        const existing = await databases.listDocuments(
            config.databaseId,
            config.collections.shares,
            [
                Query.equal('resourceType', input.resourceType),
                Query.equal('resourceId', input.resourceId),
                Query.equal('granteeUserId', granteeId),
            ]
        );

        if (existing.total > 0) {
            return error(context, 'ALREADY_EXISTS', 'Share already exists');
        }

        // Get the resource to update its permissions
        const collection = input.resourceType === 'file'
            ? config.collections.files
            : config.collections.folders;

        const resource = await databases.getDocument(
            config.databaseId,
            collection,
            input.resourceId
        );

        // Build new permissions including the grantee
        const role = input.role || 'viewer';
        const existingPermissions = resource.$permissions || [];
        
        // Add read permission for grantee
        const newPermissions = [...existingPermissions];
        const granteeReadPerm = Permission.read(Role.user(granteeId));
        if (!newPermissions.includes(granteeReadPerm)) {
            newPermissions.push(granteeReadPerm);
        }
        
        // Add write permission if editor
        if (role === 'editor') {
            const granteeUpdatePerm = Permission.update(Role.user(granteeId));
            if (!newPermissions.includes(granteeUpdatePerm)) {
                newPermissions.push(granteeUpdatePerm);
            }
        }

        // Update the resource document permissions
        await databases.updateDocument(
            config.databaseId,
            collection,
            input.resourceId,
            {},
            newPermissions
        );

        // If it's a file, also update the storage file permissions
        if (input.resourceType === 'file' && resource.storageKey) {
            try {
                const storageFile = await storage.getFile(
                    config.buckets.userFiles,
                    resource.storageKey
                );
                
                const storagePermissions = [...(storageFile.$permissions || [])];
                const storageReadPerm = Permission.read(Role.user(granteeId));
                if (!storagePermissions.includes(storageReadPerm)) {
                    storagePermissions.push(storageReadPerm);
                }
                
                await storage.updateFile(
                    config.buckets.userFiles,
                    resource.storageKey,
                    undefined, // name
                    storagePermissions
                );
            } catch (storageErr) {
                context.log(`Warning: Could not update storage permissions: ${storageErr.message}`);
            }
        }

        
        const share = await databases.createDocument(
            config.databaseId,
            config.collections.shares,
            ID.unique(),
            {
                resourceType: input.resourceType,
                resourceId: input.resourceId,
                granteeUserId: granteeId,
                role: role,
                createdBy: userId,
            },
            [
                Permission.read(Role.user(userId)),
                Permission.read(Role.user(granteeId)),
                Permission.update(Role.user(userId)),
                Permission.delete(Role.user(userId)),
            ]
        );

        
        await logActivity(databases, userId, 'share', input.resourceType, input.resourceId, {
            shareId: share.$id,
            granteeUserId: granteeId,
            granteeEmail: input.granteeEmail,
            role: role,
        });

        return success(context, share, 201);
    } catch (err) {
        context.error(`Create share error: ${err}`);
        return serverError(context);
    }
}

 
async function updateShare(context, databases, userId, shareId) {
    const input = parseBody(context);

    if (!input || !input.role) {
        return error(context, 'INVALID_INPUT', 'Role is required');
    }

    try {
        const share = await databases.getDocument(
            config.databaseId,
            config.collections.shares,
            shareId
        );

        if (share.createdBy !== userId) {
            return forbidden(context, 'Only the owner can update this share');
        }

        const updated = await databases.updateDocument(
            config.databaseId,
            config.collections.shares,
            shareId,
            { role: input.role }
        );

        
        await logActivity(databases, userId, 'update_share', share.resourceType, share.resourceId, {
            shareId,
            granteeUserId: share.granteeUserId,
            oldRole: share.role,
            newRole: input.role,
        });

        return success(context, updated);
    } catch (err) {
        if (err?.code === 404) {
            return notFound(context, 'Share not found');
        }
        context.error(`Update share error: ${err}`);
        return serverError(context);
    }
}

 
async function deleteShare(context, databases, userId, shareId, storage) {
    try {
        const share = await databases.getDocument(
            config.databaseId,
            config.collections.shares,
            shareId
        );

        
        if (share.createdBy !== userId && share.granteeUserId !== userId) {
            return forbidden(context, 'Access denied');
        }

        // Remove permissions from the resource
        try {
            const collection = share.resourceType === 'file'
                ? config.collections.files
                : config.collections.folders;

            const resource = await databases.getDocument(
                config.databaseId,
                collection,
                share.resourceId
            );

            // Filter out grantee's permissions
            const granteeReadPerm = Permission.read(Role.user(share.granteeUserId));
            const granteeUpdatePerm = Permission.update(Role.user(share.granteeUserId));
            const newPermissions = (resource.$permissions || []).filter(
                p => p !== granteeReadPerm && p !== granteeUpdatePerm
            );

            await databases.updateDocument(
                config.databaseId,
                collection,
                share.resourceId,
                {},
                newPermissions
            );

            // If it's a file, also update storage permissions
            if (share.resourceType === 'file' && resource.storageKey) {
                try {
                    const storageFile = await storage.getFile(
                        config.buckets.userFiles,
                        resource.storageKey
                    );
                    
                    const storagePermissions = (storageFile.$permissions || []).filter(
                        p => p !== granteeReadPerm
                    );
                    
                    await storage.updateFile(
                        config.buckets.userFiles,
                        resource.storageKey,
                        undefined,
                        storagePermissions
                    );
                } catch (storageErr) {
                    context.log(`Warning: Could not update storage permissions: ${storageErr.message}`);
                }
            }
        } catch (permErr) {
            context.log(`Warning: Could not remove resource permissions: ${permErr.message}`);
        }

        await databases.deleteDocument(
            config.databaseId,
            config.collections.shares,
            shareId
        );

        
        await logActivity(databases, userId, 'unshare', share.resourceType, share.resourceId, {
            shareId,
            granteeUserId: share.granteeUserId,
            role: share.role,
        });

        return success(context, { deleted: true });
    } catch (err) {
        if (err?.code === 404) {
            return notFound(context, 'Share not found');
        }
        context.error(`Delete share error: ${err}`);
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

    context.log(`Manage Shares: ${method} ${path}`);

    try {
        switch (method) {
            case 'GET': {
                if (pathParts.length === 0 && query.sharedWithMe === 'true') {
                    return getSharedWithMe(context, databases, userId);
                }

                if (!query.resourceType || !query.resourceId) {
                    return error(context, 'INVALID_INPUT', 'resourceType and resourceId required');
                }

                return listShares(
                    context,
                    databases,
                    userId,
                    query.resourceType,
                    query.resourceId
                );
            }

            case 'POST': {
                return createShare(context, databases, userId, storage);
            }

            case 'PATCH': {
                if (pathParts.length !== 1) {
                    return error(context, 'INVALID_INPUT', 'Share ID required');
                }
                return updateShare(context, databases, userId, pathParts[0]);
            }

            case 'DELETE': {
                if (pathParts.length !== 1) {
                    return error(context, 'INVALID_INPUT', 'Share ID required');
                }
                return deleteShare(context, databases, userId, pathParts[0], storage);
            }

            default:
                return error(context, 'METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
    } catch (err) {
        context.error(`Unhandled error: ${err}`);
        return serverError(context);
    }
}

