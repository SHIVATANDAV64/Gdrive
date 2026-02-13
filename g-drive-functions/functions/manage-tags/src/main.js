/**
 * Manage Tags Function
 * Handles CRUD operations for tags/labels on files and folders
 */

import { Client, Databases, Query, ID, Permission, Role } from 'node-appwrite';

// ============================================================================
// Configuration
// ============================================================================

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
            tags: requireEnv('COLLECTION_TAGS'),
            resourceTags: requireEnv('COLLECTION_RESOURCE_TAGS'),
            activities: requireEnv('COLLECTION_ACTIVITIES'),
        },
    };
}

// ============================================================================
// Response Helpers
// ============================================================================

function success(context, data, status = 200) {
    return context.res.json({ success: true, data }, status);
}

function error(context, code, message, status = 400) {
    return context.res.json({ success: false, error: { code, message } }, status);
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

// ============================================================================
// Initialize
// ============================================================================

const config = getEnvConfig();

function getClient(context) {
    return new Client()
        .setEndpoint(requireEnv('APPWRITE_FUNCTION_API_ENDPOINT'))
        .setProject(requireEnv('APPWRITE_FUNCTION_PROJECT_ID'))
        .setKey(process.env.APPWRITE_API_KEY || context.req.headers['x-appwrite-key'] || '');
}

// ============================================================================
// Activity Logging
// ============================================================================

async function logActivity(databases, userId, action, resourceType, resourceId, details = {}) {
    try {
        await databases.createDocument(
            config.databaseId,
            config.collections.activities,
            ID.unique(),
            {
                userId,
                action,
                resourceType,
                resourceId,
                details: JSON.stringify(details),
            },
            [Permission.read(Role.user(userId))]
        );
    } catch (err) {
        console.error('Failed to log activity:', err);
    }
}

// ============================================================================
// Tag Operations
// ============================================================================

/**
 * Create a new tag for the user
 */
async function createTag(context, databases, userId) {
    const input = parseBody(context);

    if (!input || !input.name) {
        return error(context, 'INVALID_INPUT', 'Tag name is required');
    }

    const name = input.name.trim().toLowerCase();
    const color = input.color || '#6366f1'; // Default indigo color

    if (name.length < 1 || name.length > 50) {
        return error(context, 'INVALID_INPUT', 'Tag name must be 1-50 characters');
    }

    // Validate color format
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
        return error(context, 'INVALID_INPUT', 'Invalid color format. Use hex color (e.g., #6366f1)');
    }

    try {
        // Check if tag already exists for this user
        const existing = await databases.listDocuments(
            config.databaseId,
            config.collections.tags,
            [
                Query.equal('userId', userId),
                Query.equal('name', name),
                Query.limit(1)
            ]
        );

        if (existing.documents.length > 0) {
            return error(context, 'DUPLICATE', 'A tag with this name already exists');
        }

        // Create the tag
        const tag = await databases.createDocument(
            config.databaseId,
            config.collections.tags,
            ID.unique(),
            {
                userId,
                name,
                color,
            },
            [
                Permission.read(Role.user(userId)),
                Permission.update(Role.user(userId)),
                Permission.delete(Role.user(userId)),
            ]
        );

        return success(context, tag, 201);
    } catch (err) {
        context.error(`Create tag error: ${err}`);
        return serverError(context, `Failed to create tag: ${err.message || err}`);
    }
}

/**
 * List all tags for the user
 */
async function listTags(context, databases, userId) {
    try {
        const result = await databases.listDocuments(
            config.databaseId,
            config.collections.tags,
            [
                Query.equal('userId', userId),
                Query.orderAsc('name'),
                Query.limit(100)
            ]
        );

        return success(context, {
            tags: result.documents,
            total: result.total,
        });
    } catch (err) {
        context.error(`List tags error: ${err}`);
        return serverError(context, `Failed to list tags: ${err.message || err}`);
    }
}

/**
 * Update a tag
 */
async function updateTag(context, databases, userId, tagId) {
    const input = parseBody(context);

    if (!input) {
        return error(context, 'INVALID_INPUT', 'No update data provided');
    }

    try {
        // Get existing tag
        const tag = await databases.getDocument(
            config.databaseId,
            config.collections.tags,
            tagId
        );

        if (tag.userId !== userId) {
            return error(context, 'FORBIDDEN', 'Access denied', 403);
        }

        const updates = {};

        if (input.name !== undefined) {
            const name = input.name.trim().toLowerCase();
            if (name.length < 1 || name.length > 50) {
                return error(context, 'INVALID_INPUT', 'Tag name must be 1-50 characters');
            }

            // Check for duplicate name
            const existing = await databases.listDocuments(
                config.databaseId,
                config.collections.tags,
                [
                    Query.equal('userId', userId),
                    Query.equal('name', name),
                    Query.notEqual('$id', tagId),
                    Query.limit(1)
                ]
            );

            if (existing.documents.length > 0) {
                return error(context, 'DUPLICATE', 'A tag with this name already exists');
            }

            updates.name = name;
        }

        if (input.color !== undefined) {
            if (!/^#[0-9A-Fa-f]{6}$/.test(input.color)) {
                return error(context, 'INVALID_INPUT', 'Invalid color format');
            }
            updates.color = input.color;
        }

        if (Object.keys(updates).length === 0) {
            return success(context, tag);
        }

        const updated = await databases.updateDocument(
            config.databaseId,
            config.collections.tags,
            tagId,
            updates
        );

        return success(context, updated);
    } catch (err) {
        if (err?.code === 404) {
            return notFound(context, 'Tag not found');
        }
        context.error(`Update tag error: ${err}`);
        return serverError(context, `Failed to update tag: ${err.message || err}`);
    }
}

/**
 * Delete a tag and all its associations
 */
async function deleteTag(context, databases, userId, tagId) {
    try {
        // Get existing tag
        const tag = await databases.getDocument(
            config.databaseId,
            config.collections.tags,
            tagId
        );

        if (tag.userId !== userId) {
            return error(context, 'FORBIDDEN', 'Access denied', 403);
        }

        // Delete all resource-tag associations
        let cursor = null;
        while (true) {
            const queries = [
                Query.equal('tagId', tagId),
                Query.limit(100)
            ];
            if (cursor) queries.push(Query.cursorAfter(cursor));

            const associations = await databases.listDocuments(
                config.databaseId,
                config.collections.resourceTags,
                queries
            );

            for (const assoc of associations.documents) {
                await databases.deleteDocument(
                    config.databaseId,
                    config.collections.resourceTags,
                    assoc.$id
                );
            }

            if (associations.documents.length < 100) break;
            cursor = associations.documents[associations.documents.length - 1].$id;
        }

        // Delete the tag itself
        await databases.deleteDocument(
            config.databaseId,
            config.collections.tags,
            tagId
        );

        return success(context, { deleted: true });
    } catch (err) {
        if (err?.code === 404) {
            return notFound(context, 'Tag not found');
        }
        context.error(`Delete tag error: ${err}`);
        return serverError(context, `Failed to delete tag: ${err.message || err}`);
    }
}

/**
 * Add tag to a resource (file or folder)
 */
async function addTagToResource(context, databases, userId) {
    const input = parseBody(context);

    if (!input || !input.tagId || !input.resourceType || !input.resourceId) {
        return error(context, 'INVALID_INPUT', 'tagId, resourceType, and resourceId are required');
    }

    if (!['file', 'folder'].includes(input.resourceType)) {
        return error(context, 'INVALID_INPUT', 'resourceType must be "file" or "folder"');
    }

    try {
        // Verify tag belongs to user
        const tag = await databases.getDocument(
            config.databaseId,
            config.collections.tags,
            input.tagId
        );

        if (tag.userId !== userId) {
            return error(context, 'FORBIDDEN', 'Tag not found', 403);
        }

        // Verify resource exists and belongs to user
        const collection = input.resourceType === 'file' 
            ? config.collections.files 
            : config.collections.folders;

        const resource = await databases.getDocument(
            config.databaseId,
            collection,
            input.resourceId
        );

        if (resource.ownerId !== userId) {
            return error(context, 'FORBIDDEN', 'Resource not found', 403);
        }

        // Check if already tagged
        const existing = await databases.listDocuments(
            config.databaseId,
            config.collections.resourceTags,
            [
                Query.equal('tagId', input.tagId),
                Query.equal('resourceType', input.resourceType),
                Query.equal('resourceId', input.resourceId),
                Query.limit(1)
            ]
        );

        if (existing.documents.length > 0) {
            return success(context, existing.documents[0]); // Already exists
        }

        // Create association
        const resourceTag = await databases.createDocument(
            config.databaseId,
            config.collections.resourceTags,
            ID.unique(),
            {
                tagId: input.tagId,
                resourceType: input.resourceType,
                resourceId: input.resourceId,
                userId,
            },
            [
                Permission.read(Role.user(userId)),
                Permission.delete(Role.user(userId)),
            ]
        );

        // Log activity
        await logActivity(databases, userId, 'tag', input.resourceType, input.resourceId, {
            tagName: tag.name,
            action: 'add',
        });

        return success(context, resourceTag, 201);
    } catch (err) {
        if (err?.code === 404) {
            return notFound(context, 'Tag or resource not found');
        }
        context.error(`Add tag to resource error: ${err}`);
        return serverError(context, `Failed to add tag: ${err.message || err}`);
    }
}

/**
 * Remove tag from a resource
 */
async function removeTagFromResource(context, databases, userId) {
    const input = parseBody(context);

    if (!input || !input.tagId || !input.resourceType || !input.resourceId) {
        return error(context, 'INVALID_INPUT', 'tagId, resourceType, and resourceId are required');
    }

    try {
        // Find the association
        const existing = await databases.listDocuments(
            config.databaseId,
            config.collections.resourceTags,
            [
                Query.equal('tagId', input.tagId),
                Query.equal('resourceType', input.resourceType),
                Query.equal('resourceId', input.resourceId),
                Query.equal('userId', userId),
                Query.limit(1)
            ]
        );

        if (existing.documents.length === 0) {
            return success(context, { removed: true }); // Already removed
        }

        // Get tag name for logging
        let tagName = 'unknown';
        try {
            const tag = await databases.getDocument(
                config.databaseId,
                config.collections.tags,
                input.tagId
            );
            tagName = tag.name;
        } catch {}

        // Delete association
        await databases.deleteDocument(
            config.databaseId,
            config.collections.resourceTags,
            existing.documents[0].$id
        );

        // Log activity
        await logActivity(databases, userId, 'tag', input.resourceType, input.resourceId, {
            tagName,
            action: 'remove',
        });

        return success(context, { removed: true });
    } catch (err) {
        context.error(`Remove tag from resource error: ${err}`);
        return serverError(context, `Failed to remove tag: ${err.message || err}`);
    }
}

/**
 * Get tags for a resource
 */
async function getResourceTags(context, databases, userId, resourceType, resourceId) {
    try {
        // Get all tag associations for this resource
        const associations = await databases.listDocuments(
            config.databaseId,
            config.collections.resourceTags,
            [
                Query.equal('resourceType', resourceType),
                Query.equal('resourceId', resourceId),
                Query.equal('userId', userId),
                Query.limit(50)
            ]
        );

        if (associations.documents.length === 0) {
            return success(context, { tags: [] });
        }

        // Get the actual tags
        const tagIds = associations.documents.map(a => a.tagId);
        const tags = await databases.listDocuments(
            config.databaseId,
            config.collections.tags,
            [
                Query.equal('$id', tagIds),
                Query.limit(50)
            ]
        );

        return success(context, { tags: tags.documents });
    } catch (err) {
        context.error(`Get resource tags error: ${err}`);
        return serverError(context, `Failed to get tags: ${err.message || err}`);
    }
}

/**
 * Get all resources with a specific tag
 */
async function getResourcesByTag(context, databases, userId, tagId) {
    try {
        // Verify tag belongs to user
        const tag = await databases.getDocument(
            config.databaseId,
            config.collections.tags,
            tagId
        );

        if (tag.userId !== userId) {
            return error(context, 'FORBIDDEN', 'Tag not found', 403);
        }

        // Get all associations for this tag
        const associations = await databases.listDocuments(
            config.databaseId,
            config.collections.resourceTags,
            [
                Query.equal('tagId', tagId),
                Query.equal('userId', userId),
                Query.limit(100)
            ]
        );

        // Fetch actual resources
        const files = [];
        const folders = [];

        for (const assoc of associations.documents) {
            try {
                const collection = assoc.resourceType === 'file'
                    ? config.collections.files
                    : config.collections.folders;

                const resource = await databases.getDocument(
                    config.databaseId,
                    collection,
                    assoc.resourceId
                );

                // Only include non-deleted resources
                if (!resource.isDeleted) {
                    if (assoc.resourceType === 'file') {
                        files.push(resource);
                    } else {
                        folders.push(resource);
                    }
                }
            } catch {
                // Resource may have been deleted
            }
        }

        return success(context, {
            tag,
            files,
            folders,
            total: files.length + folders.length,
        });
    } catch (err) {
        if (err?.code === 404) {
            return notFound(context, 'Tag not found');
        }
        context.error(`Get resources by tag error: ${err}`);
        return serverError(context, `Failed to get resources: ${err.message || err}`);
    }
}

// ============================================================================
// Main Handler
// ============================================================================

export default async function main(context) {
    const client = getClient(context);
    const databases = new Databases(client);

    const userId = getUserId(context);
    if (!userId) {
        return unauthorized(context);
    }

    const { method, path } = context.req;
    const pathParts = path.split('/').filter(Boolean);

    context.log(`Manage Tags: ${method} ${path}`);

    try {
        switch (method) {
            case 'GET': {
                // GET / - List all tags
                if (pathParts.length === 0) {
                    return listTags(context, databases, userId);
                }
                // GET /tag/:tagId/resources - Get resources with tag
                if (pathParts.length === 3 && pathParts[0] === 'tag' && pathParts[2] === 'resources') {
                    return getResourcesByTag(context, databases, userId, pathParts[1]);
                }
                // GET /resource/:type/:id - Get tags for a resource
                if (pathParts.length === 3 && pathParts[0] === 'resource') {
                    return getResourceTags(context, databases, userId, pathParts[1], pathParts[2]);
                }
                return notFound(context, 'Invalid endpoint');
            }

            case 'POST': {
                // POST / - Create tag
                if (pathParts.length === 0) {
                    return createTag(context, databases, userId);
                }
                // POST /assign - Add tag to resource
                if (pathParts.length === 1 && pathParts[0] === 'assign') {
                    return addTagToResource(context, databases, userId);
                }
                // POST /unassign - Remove tag from resource
                if (pathParts.length === 1 && pathParts[0] === 'unassign') {
                    return removeTagFromResource(context, databases, userId);
                }
                return notFound(context, 'Invalid endpoint');
            }

            case 'PATCH': {
                // PATCH /:tagId - Update tag
                if (pathParts.length === 1) {
                    return updateTag(context, databases, userId, pathParts[0]);
                }
                return notFound(context, 'Invalid endpoint');
            }

            case 'DELETE': {
                // DELETE /:tagId - Delete tag
                if (pathParts.length === 1) {
                    return deleteTag(context, databases, userId, pathParts[0]);
                }
                return notFound(context, 'Invalid endpoint');
            }

            default:
                return error(context, 'METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
    } catch (err) {
        context.error(`Unhandled error: ${err}`);
        return serverError(context, `Unhandled error: ${err.message || err}`);
    }
}
