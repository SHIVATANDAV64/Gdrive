 

import { Client, Databases, Storage, Query } from 'node-appwrite';





 

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
            folders: requireEnv('COLLECTION_FOLDERS'),
            files: requireEnv('COLLECTION_FILES'),
            shares: requireEnv('COLLECTION_SHARES'),
            linkShares: requireEnv('COLLECTION_LINK_SHARES'),
            stars: requireEnv('COLLECTION_STARS'),
        },
        buckets: {
            userFiles: requireEnv('BUCKET_USER_FILES'),
        },
        settings: {
            
            trashRetentionDays: parseInt(requireEnv('TRASH_RETENTION_DAYS'), 10),
            
            batchSize: parseInt(requireEnv('CLEANUP_BATCH_SIZE'), 10),
        },
    };
}

const config = getEnvConfig();





 
function getClient() {
    return new Client()
        .setEndpoint(requireEnv('APPWRITE_FUNCTION_API_ENDPOINT'))
        .setProject(requireEnv('APPWRITE_FUNCTION_PROJECT_ID'))
        .setKey(requireEnv('APPWRITE_API_KEY'));
}

 
function getCutoffDate() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - config.settings.trashRetentionDays);
    return cutoff.toISOString();
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
            await databases.deleteDocument(
                config.databaseId,
                config.collections.shares,
                share.$id
            );
        }
    } catch (err) {
        
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
            await databases.deleteDocument(
                config.databaseId,
                config.collections.linkShares,
                link.$id
            );
        }
    } catch (err) {
        
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
            await databases.deleteDocument(
                config.databaseId,
                config.collections.stars,
                star.$id
            );
        }
    } catch (err) {
        
    }
}





 
export default async function main(context) {
    const client = getClient();
    const databases = new Databases(client);
    const storage = new Storage(client);

    const cutoffDate = getCutoffDate();
    const stats = {
        filesDeleted: 0,
        foldersDeleted: 0,
        errors: [],
        startTime: new Date().toISOString(),
    };

    context.log(`Starting trash cleanup. Cutoff date: ${cutoffDate}`);
    context.log(`Retention period: ${config.settings.trashRetentionDays} days`);

    try {
        
        
        
        context.log('Fetching expired files...');

        const expiredFiles = await databases.listDocuments(
            config.databaseId,
            config.collections.files,
            [
                Query.equal('isDeleted', true),
                Query.lessThan('$updatedAt', cutoffDate),
                Query.limit(config.settings.batchSize),
            ]
        );

        context.log(`Found ${expiredFiles.total} expired files to delete`);

        for (const file of expiredFiles.documents) {
            try {
                
                await deleteRelatedRecords(databases, 'file', file.$id);

                
                if (file.storageKey) {
                    try {
                        await storage.deleteFile(config.buckets.userFiles, file.storageKey);
                    } catch (storageErr) {
                        
                        context.log(`Storage file not found: ${file.storageKey}`);
                    }
                }

                
                await databases.deleteDocument(
                    config.databaseId,
                    config.collections.files,
                    file.$id
                );

                stats.filesDeleted++;
                context.log(`Deleted file: ${file.name} (${file.$id})`);
            } catch (fileErr) {
                const errorMsg = `Failed to delete file ${file.$id}: ${fileErr.message}`;
                stats.errors.push(errorMsg);
                context.error(errorMsg);
            }
        }

        
        
        
        context.log('Fetching expired folders...');

        const expiredFolders = await databases.listDocuments(
            config.databaseId,
            config.collections.folders,
            [
                Query.equal('isDeleted', true),
                Query.lessThan('$updatedAt', cutoffDate),
                Query.limit(config.settings.batchSize),
            ]
        );

        context.log(`Found ${expiredFolders.total} expired folders to delete`);

        for (const folder of expiredFolders.documents) {
            try {
                
                const nestedFiles = await databases.listDocuments(
                    config.databaseId,
                    config.collections.files,
                    [
                        Query.equal('folderId', folder.$id),
                        Query.limit(100),
                    ]
                );

                for (const file of nestedFiles.documents) {
                    try {
                        await deleteRelatedRecords(databases, 'file', file.$id);

                        
                        if (file.storageKey) {
                            try {
                                await storage.deleteFile(config.buckets.userFiles, file.storageKey);
                            } catch (storageErr) {
                                
                                context.log(`Storage file not found: ${file.storageKey}`);
                            }
                        }

                        
                        await databases.deleteDocument(
                            config.databaseId,
                            config.collections.files,
                            file.$id
                        );
                        stats.filesDeleted++;
                    } catch (nestedErr) {
                        
                    }
                }

                
                const nestedFolders = await databases.listDocuments(
                    config.databaseId,
                    config.collections.folders,
                    [
                        Query.equal('parentId', folder.$id),
                        Query.limit(100),
                    ]
                );

                for (const nestedFolder of nestedFolders.documents) {
                    await deleteRelatedRecords(databases, 'folder', nestedFolder.$id);
                    await databases.deleteDocument(
                        config.databaseId,
                        config.collections.folders,
                        nestedFolder.$id
                    );
                    stats.foldersDeleted++;
                }

                
                await deleteRelatedRecords(databases, 'folder', folder.$id);

                
                await databases.deleteDocument(
                    config.databaseId,
                    config.collections.folders,
                    folder.$id
                );

                stats.foldersDeleted++;
                context.log(`Deleted folder: ${folder.name} (${folder.$id})`);
            } catch (folderErr) {
                const errorMsg = `Failed to delete folder ${folder.$id}: ${folderErr.message}`;
                stats.errors.push(errorMsg);
                context.error(errorMsg);
            }
        }
    } catch (err) {
        const errorMsg = `Trash cleanup failed: ${err.message}`;
        stats.errors.push(errorMsg);
        context.error(errorMsg);
    }

    
    
    
    stats.endTime = new Date().toISOString();

    const summary = {
        success: stats.errors.length === 0,
        stats: {
            filesDeleted: stats.filesDeleted,
            foldersDeleted: stats.foldersDeleted,
            totalDeleted: stats.filesDeleted + stats.foldersDeleted,
            errorsCount: stats.errors.length,
        },
        timing: {
            startTime: stats.startTime,
            endTime: stats.endTime,
        },
        errors: stats.errors.length > 0 ? stats.errors : undefined,
    };

    context.log(`Cleanup complete: ${summary.stats.totalDeleted} items deleted`);

    if (stats.errors.length > 0) {
        context.log(`Errors: ${stats.errors.length}`);
    }

    return context.res.json(summary);
}

