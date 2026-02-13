

import { Client, Databases, Storage, Query, ID, Permission, Role } from 'node-appwrite';





const RATE_LIMIT = {
    windowMs: 60 * 1000,
    maxRequests: 100,
};


async function checkRateLimit(databases, userId) {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT.windowMs;
    const rateLimitCollectionId = requireEnv('COLLECTION_RATE_LIMITS');
    const cfg = getEnvConfig();

    try {

        const records = await databases.listDocuments(
            cfg.databaseId,
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
                cfg.databaseId,
                rateLimitCollectionId,
                ID.unique(),
                {
                    userId,
                    timestamp: now.toString(),
                    createdAt: new Date().toISOString(),
                }
            );
        } catch (recordErr) {

            console.warn('Failed to record rate limit:', recordErr.message);
        }

        return { allowed: true, remaining: remaining - 1, resetTime };
    } catch (err) {

        console.warn('Rate limit check failed, allowing request:', err.message);
        return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1, resetTime: Math.ceil((now + RATE_LIMIT.windowMs) / 1000) };
    }
}







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


function isValidFileName(name) {
    if (!isNotEmpty(name)) return false;
    if (name.length > 255) return false;

    if (/[/\\<>:"|?*\x00-\x1f]/.test(name)) return false;
    return true;
}


const MAGIC_SIGNATURES = {

    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]],
    'image/svg+xml': null,


    'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
    'application/zip': [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06], [0x50, 0x4B, 0x07, 0x08]],
    'application/x-rar-compressed': [[0x52, 0x61, 0x72, 0x21, 0x1A, 0x07]],
    'application/x-7z-compressed': [[0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C]],


    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [[0x50, 0x4B, 0x03, 0x04]],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [[0x50, 0x4B, 0x03, 0x04]],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': [[0x50, 0x4B, 0x03, 0x04]],


    'application/msword': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],
    'application/vnd.ms-excel': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],
    'application/vnd.ms-powerpoint': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],


    'audio/mpeg': [[0xFF, 0xFB], [0xFF, 0xFA], [0xFF, 0xF3], [0xFF, 0xF2], [0x49, 0x44, 0x33]],
    'audio/wav': [[0x52, 0x49, 0x46, 0x46]],
    'audio/ogg': [[0x4F, 0x67, 0x67, 0x53]],


    'video/mp4': [[0x00, 0x00, 0x00], [0x66, 0x74, 0x79, 0x70]],
    'video/webm': [[0x1A, 0x45, 0xDF, 0xA3]],
    'video/ogg': [[0x4F, 0x67, 0x67, 0x53]],


    'text/plain': null,
    'text/csv': null,
    'text/markdown': null,
    'text/html': null,
    'text/css': null,
    'application/json': null,
    'application/javascript': null,


    'application/octet-stream': null,
};


function detectMimeFromBytes(bytes) {
    const detected = [];

    for (const [mimeType, signatures] of Object.entries(MAGIC_SIGNATURES)) {
        if (signatures === null) {
            continue;
        }

        for (const signature of signatures) {
            if (bytes.length >= signature.length) {
                let matches = true;
                for (let i = 0; i < signature.length; i++) {
                    if (bytes[i] !== signature[i]) {
                        matches = false;
                        break;
                    }
                }
                if (matches) {
                    detected.push(mimeType);
                    break;
                }
            }
        }
    }

    return detected;
}


async function validateFileMimeType(storage, storageKey, claimedMimeType) {

    const textBasedTypes = [
        'text/plain', 'text/csv', 'text/markdown', 'text/html', 'text/css',
        'application/json', 'application/javascript', 'image/svg+xml',
        'application/octet-stream'
    ];

    if (textBasedTypes.includes(claimedMimeType)) {
        return { valid: true, detectedTypes: [claimedMimeType] };
    }

    try {


        const fileBuffer = await storage.getFileDownload(
            getEnvConfig().buckets.userFiles,
            storageKey
        );


        const bytes = new Uint8Array(fileBuffer.slice(0, 16));
        const detectedTypes = detectMimeFromBytes(bytes);

        if (detectedTypes.length === 0) {


            return {
                valid: textBasedTypes.includes(claimedMimeType),
                detectedTypes: [],
                reason: 'Could not verify file type from content'
            };
        }



        const zipBasedTypes = [
            'application/zip',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ];

        const oleBasedTypes = [
            'application/msword',
            'application/vnd.ms-excel',
            'application/vnd.ms-powerpoint',
        ];


        if (detectedTypes.includes(claimedMimeType)) {
            return { valid: true, detectedTypes };
        }


        if (zipBasedTypes.includes(claimedMimeType) &&
            detectedTypes.some(t => zipBasedTypes.includes(t))) {
            return { valid: true, detectedTypes };
        }


        if (oleBasedTypes.includes(claimedMimeType) &&
            detectedTypes.some(t => oleBasedTypes.includes(t))) {
            return { valid: true, detectedTypes };
        }


        if ((claimedMimeType === 'audio/wav' || claimedMimeType === 'image/webp') &&
            detectedTypes.includes('audio/wav')) {
            return { valid: true, detectedTypes };
        }

        return {
            valid: false,
            detectedTypes,
            reason: `File content does not match claimed type. Detected: ${detectedTypes.join(', ')}`
        };
    } catch (err) {

        console.warn(`Could not validate file MIME type: ${err.message}`);
        return { valid: true, detectedTypes: [], reason: 'Validation skipped due to read error' };
    }
}


async function checkInheritedShareAccess(databases, config, resourceType, resourceId, userId, requiredRole = 'viewer') {
    const checkedFolders = new Set();
    let currentType = resourceType;
    let currentId = resourceId;

    while (currentId) {
        // 1. Check direct share on this resource
        const shares = await databases.listDocuments(
            config.databaseId,
            config.collections.shares,
            [
                Query.equal('resourceType', currentType),
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
        try {
            if (currentType === 'file') {
                const file = await databases.getDocument(config.databaseId, config.collections.files, currentId);
                if (file.ownerId === userId) return { allowed: true, role: 'owner' };
                currentId = file.folderId;
                currentType = 'folder';
            } else {
                if (checkedFolders.has(currentId)) break;
                checkedFolders.add(currentId);

                const folder = await databases.getDocument(config.databaseId, config.collections.folders, currentId);
                if (folder.ownerId === userId) return { allowed: true, role: 'owner' };
                currentId = folder.parentId;
                currentType = 'folder';
            }
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






async function listFiles(context, databases, userId, folderId) {
    try {

        const ownedQueries = [
            Query.equal('ownerId', userId),
            Query.equal('isDeleted', false),
            Query.orderAsc('name'),
        ];

        if (folderId) {
            ownedQueries.push(Query.equal('folderId', folderId));
        } else {
            ownedQueries.push(Query.isNull('folderId'));
        }

        const ownedResult = await databases.listDocuments(
            config.databaseId,
            config.collections.files,
            ownedQueries
        );


        let sharedFiles = [];

        if (folderId) {

            const folderShareAccess = await checkInheritedShareAccess(
                databases, config, 'folder', folderId, userId, 'viewer'
            );

            if (folderShareAccess.allowed) {

                try {
                    const folderFiles = await databases.listDocuments(
                        config.databaseId,
                        config.collections.files,
                        [
                            Query.equal('folderId', folderId),
                            Query.equal('isDeleted', false),
                            Query.orderAsc('name'),
                        ]
                    );


                    for (const file of folderFiles.documents) {
                        if (file.ownerId !== userId) {
                            file._sharedWithMe = true;
                            file._shareRole = folderShareAccess.role;
                            sharedFiles.push(file);
                        }
                    }
                } catch (err) {
                    context.log(`Could not fetch shared folder files: ${err.message}`);
                }
            }
        }


        try {
            const fileShares = await databases.listDocuments(
                config.databaseId,
                config.collections.shares,
                [
                    Query.equal('resourceType', 'file'),
                    Query.equal('granteeUserId', userId),
                ]
            );

            if (fileShares.total > 0) {
                for (const share of fileShares.documents) {
                    try {
                        const file = await databases.getDocument(
                            config.databaseId,
                            config.collections.files,
                            share.resourceId
                        );


                        if (!file.isDeleted) {
                            const matchesFolder = folderId
                                ? file.folderId === folderId
                                : file.folderId === null;

                            if (matchesFolder && file.ownerId !== userId) {
                                file._sharedWithMe = true;
                                file._shareRole = share.role;
                                sharedFiles.push(file);
                            }
                        }
                    } catch {

                    }
                }
            }
        } catch (err) {
            context.log(`Could not fetch shared files: ${err.message}`);
        }


        const allFiles = [...ownedResult.documents];
        for (const sharedFile of sharedFiles) {
            if (!allFiles.some(f => f.$id === sharedFile.$id)) {
                allFiles.push(sharedFile);
            }
        }


        allFiles.sort((a, b) => a.name.localeCompare(b.name));

        return success(context, {
            files: allFiles,
            total: allFiles.length,
        });
    } catch (err) {
        context.error(`List files error: ${err}`);
        return serverError(context, `Failed to list files: ${err.message || err}`);
    }
}


async function getRecentFiles(context, databases, userId, limit = 20) {
    try {
        const result = await databases.listDocuments(
            config.databaseId,
            config.collections.files,
            [
                Query.equal('ownerId', userId),
                Query.equal('isDeleted', false),
                Query.orderDesc('$updatedAt'),
                Query.limit(limit),
            ]
        );

        return success(context, {
            files: result.documents,
            total: result.total,
        });
    } catch (err) {
        context.error(`Get recent files error: ${err}`);
        return serverError(context, `Failed to get recent files: ${err.message || err}`);
    }
}


async function getFile(context, databases, storage, userId, fileId) {
    try {
        const file = await databases.getDocument(
            config.databaseId,
            config.collections.files,
            fileId
        );

        if (file.ownerId !== userId) {

            const shareAccess = await checkInheritedShareAccess(databases, config, 'file', fileId, userId, 'viewer');
            if (!shareAccess.allowed) {
                return forbidden(context, 'You do not have access to this file');
            }
        }

        if (file.isDeleted) {
            return notFound(context, 'File not found');
        }


        const downloadUrl = storage.getFileDownload(
            config.buckets.userFiles,
            file.storageKey
        );

        return success(context, {
            ...file,
            downloadUrl: downloadUrl.toString(),
        });
    } catch (err) {
        if (err?.code === 404) {
            return notFound(context, 'File not found');
        }
        context.error(`Get file error: ${err}`);
        return serverError(context, `Failed to get file: ${err.message || err}`);
    }
}


async function createFile(context, databases, userId) {
    const input = parseBody(context);

    if (!input || !input.name || !input.storageKey) {
        return error(context, 'INVALID_INPUT', 'Missing required fields');
    }

    if (!isValidFileName(input.name)) {
        return error(context, 'INVALID_INPUT', 'Invalid file name');
    }


    if (input.sizeBytes && input.sizeBytes > config.settings.maxFileSize) {
        return error(context, 'FILE_TOO_LARGE', `File size exceeds maximum allowed (${Math.round(config.settings.maxFileSize / 1024 / 1024)}MB)`);
    }


    const allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'text/csv', 'text/markdown',
        'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
        'audio/mpeg', 'audio/wav', 'audio/ogg',
        'video/mp4', 'video/webm', 'video/ogg',
        'application/json', 'application/javascript', 'text/html', 'text/css',
        'application/octet-stream',
    ];

    if (input.mimeType && !allowedMimeTypes.includes(input.mimeType)) {
        return error(context, 'INVALID_FILE_TYPE', `File type "${input.mimeType}" is not supported`);
    }


    const storage = new Storage(getClient(context));
    const mimeValidation = await validateFileMimeType(
        storage,
        input.storageKey,
        input.mimeType || 'application/octet-stream'
    );

    if (!mimeValidation.valid) {
        context.log(`MIME type validation failed: ${mimeValidation.reason}`);
        return error(
            context,
            'MIME_TYPE_MISMATCH',
            mimeValidation.reason || 'File content does not match declared type',
            400
        );
    }

    try {

        if (input.folderId) {
            const folder = await databases.getDocument(
                config.databaseId,
                config.collections.folders,
                input.folderId
            );

            if (folder.ownerId !== userId) {
                return forbidden(context, 'Access denied to folder');
            }
        }


        const file = await databases.createDocument(
            config.databaseId,
            config.collections.files,
            ID.unique(),
            {
                name: input.name,
                mimeType: input.mimeType || 'application/octet-stream',
                sizeBytes: input.sizeBytes || 0,
                storageKey: input.storageKey,
                ownerId: userId,
                folderId: input.folderId ?? null,
                versionId: null,
                checksum: null,
                isDeleted: false,
            },
            [
                Permission.read(Role.user(userId)),
                Permission.update(Role.user(userId)),
                Permission.delete(Role.user(userId)),
            ]
        );


        await logActivity(databases, userId, 'upload', 'file', file.$id, {
            name: file.name,
            mimeType: file.mimeType,
            sizeBytes: file.sizeBytes,
            folderId: file.folderId,
        });

        return success(context, file, 201);
    } catch (err) {
        context.error(`Create file error: ${err}`);
        return serverError(context, `Failed to create file: ${err.message || err}`);
    }
}


async function updateFile(context, databases, userId, fileId) {
    const input = parseBody(context);

    if (!input) {
        return error(context, 'INVALID_INPUT', 'No update data provided');
    }

    try {
        const file = await databases.getDocument(
            config.databaseId,
            config.collections.files,
            fileId
        );

        if (file.ownerId !== userId) {

            const shareAccess = await checkInheritedShareAccess(databases, config, 'file', fileId, userId, 'editor');
            if (!shareAccess.allowed) {
                return forbidden(context, 'Access denied - editor permission required');
            }
        }

        if (file.isDeleted) {
            return notFound(context, 'File not found');
        }

        const updates = {};


        if (input.name !== undefined) {
            if (!isValidFileName(input.name)) {
                return error(context, 'INVALID_INPUT', 'Invalid file name');
            }
            updates.name = input.name;
        }


        if (input.folderId !== undefined) {
            if (input.folderId !== null) {
                const folder = await databases.getDocument(
                    config.databaseId,
                    config.collections.folders,
                    input.folderId
                );

                if (folder.ownerId !== userId) {
                    return forbidden(context, 'Access denied to destination folder');
                }
            }

            updates.folderId = input.folderId;
        }

        if (input.isDeleted !== undefined) {
            updates.isDeleted = input.isDeleted;
        }

        if (Object.keys(updates).length === 0) {
            return success(context, file);
        }

        const updated = await databases.updateDocument(
            config.databaseId,
            config.collections.files,
            fileId,
            updates
        );


        const action = updates.name ? 'rename' : (updates.folderId !== undefined ? 'move' : 'rename');
        await logActivity(databases, userId, action, 'file', fileId, {
            oldName: file.name,
            newName: updates.name || file.name,
            oldFolderId: file.folderId,
            newFolderId: updates.folderId !== undefined ? updates.folderId : file.folderId,
        });

        return success(context, updated);
    } catch (err) {
        if (err?.code === 404) {
            return notFound(context, 'File not found');
        }
        context.error(`Update file error: ${err}`);
        return serverError(context, `Failed to update file: ${err.message || err}`);
    }
}


async function updateFileContent(context, databases, storage, userId, fileId) {
    const input = parseBody(context);

    if (!input || typeof input.content !== 'string') {
        return error(context, 'INVALID_INPUT', 'Content is required');
    }

    try {
        // Get existing file
        const file = await databases.getDocument(
            config.databaseId,
            config.collections.files,
            fileId
        );

        // Check ownership or editor permission
        if (file.ownerId !== userId) {
            const shareAccess = await checkInheritedShareAccess(databases, config, 'file', fileId, userId, 'editor');
            if (!shareAccess.allowed) {
                return forbidden(context, 'Access denied - editor permission required');
            }
        }

        if (file.isDeleted) {
            return notFound(context, 'File not found');
        }

        // Only allow editing text-based files
        const editableTypes = [
            'text/plain', 'text/csv', 'text/markdown', 'text/html', 'text/css',
            'application/json', 'application/javascript', 'text/javascript',
            'application/x-python', 'text/x-python',
        ];

        const isEditable = editableTypes.some(type => 
            file.mimeType === type || file.mimeType.startsWith('text/')
        );

        if (!isEditable) {
            return error(context, 'NOT_EDITABLE', 'This file type cannot be edited');
        }

        // Convert content to Buffer/Blob for upload
        const contentBuffer = Buffer.from(input.content, 'utf-8');
        const newSize = contentBuffer.length;

        // Check size limit
        if (newSize > config.settings.maxFileSize) {
            return error(context, 'FILE_TOO_LARGE', `File size exceeds maximum allowed (${Math.round(config.settings.maxFileSize / 1024 / 1024)}MB)`);
        }

        // Delete old file from storage and upload new content
        const oldStorageKey = file.storageKey;
        const newStorageKey = ID.unique();

        // Upload new content
        const { InputFile } = require('node-appwrite');
        await storage.createFile(
            config.buckets.userFiles,
            newStorageKey,
            InputFile.fromBuffer(contentBuffer, file.name),
            file.ownerId !== userId ? [
                Permission.read(Role.user(file.ownerId)),
                Permission.update(Role.user(file.ownerId)),
                Permission.delete(Role.user(file.ownerId)),
                Permission.read(Role.user(userId)),
                Permission.update(Role.user(userId)),
            ] : [
                Permission.read(Role.user(userId)),
                Permission.update(Role.user(userId)),
                Permission.delete(Role.user(userId)),
            ]
        );

        // Update file document with new storageKey and size
        const updated = await databases.updateDocument(
            config.databaseId,
            config.collections.files,
            fileId,
            {
                storageKey: newStorageKey,
                sizeBytes: newSize,
            }
        );

        // Delete old storage file (cleanup)
        try {
            await storage.deleteFile(config.buckets.userFiles, oldStorageKey);
        } catch (cleanupErr) {
            context.log(`Warning: Failed to delete old storage file: ${cleanupErr.message}`);
        }

        // Log activity
        await logActivity(databases, userId, 'edit', 'file', fileId, {
            name: file.name,
            oldSize: file.sizeBytes,
            newSize: newSize,
        });

        return success(context, updated);
    } catch (err) {
        if (err?.code === 404) {
            return notFound(context, 'File not found');
        }
        context.error(`Update file content error: ${err}`);
        return serverError(context, `Failed to update file content: ${err.message || err}`);
    }
}


async function deleteFile(context, databases, userId, fileId) {
    try {
        const file = await databases.getDocument(
            config.databaseId,
            config.collections.files,
            fileId
        );

        if (file.ownerId !== userId) {

            const shareAccess = await checkInheritedShareAccess(databases, config, 'file', fileId, userId, 'editor');
            if (!shareAccess.allowed) {
                return forbidden(context, 'Access denied - editor permission required');
            }
        }

        if (file.isDeleted) {
            return notFound(context, 'File not found');
        }


        await databases.updateDocument(
            config.databaseId,
            config.collections.files,
            fileId,
            { isDeleted: true }
        );


        await logActivity(databases, userId, 'delete', 'file', fileId, {
            name: file.name,
            folderId: file.folderId,
        });

        return success(context, { deleted: true });
    } catch (err) {
        if (err?.code === 404) {
            return notFound(context, 'File not found');
        }
        context.error(`Delete file error: ${err}`);
        return serverError(context, `Failed to delete file: ${err.message || err}`);
    }
}


async function batchDelete(context, databases, userId) {
    const input = parseBody(context);

    if (!input || !Array.isArray(input.fileIds) || input.fileIds.length === 0) {
        return error(context, 'INVALID_INPUT', 'File IDs required');
    }

    try {
        const results = {
            deleted: [],
            failed: [],
        };

        for (const fileId of input.fileIds) {
            try {
                const file = await databases.getDocument(
                    config.databaseId,
                    config.collections.files,
                    fileId
                );

                if (file.ownerId !== userId) {
                    results.failed.push({ id: fileId, reason: 'Access denied' });
                    continue;
                }

                await databases.updateDocument(
                    config.databaseId,
                    config.collections.files,
                    fileId,
                    { isDeleted: true }
                );

                results.deleted.push(fileId);
            } catch {
                results.failed.push({ id: fileId, reason: 'File not found' });
            }
        }

        return success(context, results);
    } catch (err) {
        context.error(`Batch delete error: ${err}`);
        return serverError(context, `Failed to batch delete: ${err.message || err}`);
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

    context.log(`File Operations: ${method} ${path}`);

    try {
        switch (method) {
            case 'GET': {
                if (pathParts.length === 0) {

                    const folderId = query.folderId || null;
                    return listFiles(context, databases, userId, folderId);
                } else if (pathParts.length === 1 && pathParts[0] === 'recent') {

                    const limit = parseInt(query.limit || '20', 10);
                    return getRecentFiles(context, databases, userId, limit);
                } else if (pathParts.length === 1) {

                    return getFile(context, databases, storage, userId, pathParts[0]);
                }
                return notFound(context, 'Invalid endpoint');
            }

            case 'POST': {
                if (pathParts.length === 1 && pathParts[0] === 'batch-delete') {
                    return batchDelete(context, databases, userId);
                }
                return createFile(context, databases, userId);
            }

            case 'PATCH': {
                if (pathParts.length !== 1) {
                    return error(context, 'INVALID_INPUT', 'File ID required');
                }
                return updateFile(context, databases, userId, pathParts[0]);
            }

            case 'PUT': {
                // PUT /:fileId/content - Update file content
                if (pathParts.length === 2 && pathParts[1] === 'content') {
                    return updateFileContent(context, databases, storage, userId, pathParts[0]);
                }
                return error(context, 'INVALID_INPUT', 'Invalid endpoint');
            }

            case 'DELETE': {
                if (pathParts.length !== 1) {
                    return error(context, 'INVALID_INPUT', 'File ID required');
                }
                return deleteFile(context, databases, userId, pathParts[0]);
            }

            default:
                return error(context, 'METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
    } catch (err) {
        context.error(`Unhandled error: ${err}`);
        return serverError(context, `Unhandled error: ${err.message || err}`);
    }
}

