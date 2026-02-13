/**
 * Tag Service
 * Handles tag CRUD and resource tagging operations
 */

import { functions, AppwriteConfig } from '@/lib/appwrite';
import { ExecutionMethod } from 'appwrite';
import { safeParseJSON } from '@/lib/utils';

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: { code: string; message: string };
}

export interface Tag {
    $id: string;
    userId: string;
    name: string;
    color: string;
    $createdAt: string;
    $updatedAt: string;
}

export interface ResourceTag {
    $id: string;
    tagId: string;
    resourceType: 'file' | 'folder';
    resourceId: string;
    userId: string;
}

// Predefined colors for tags
export const TAG_COLORS = [
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#eab308', // yellow
    '#84cc16', // lime
    '#22c55e', // green
    '#10b981', // emerald
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#0ea5e9', // sky
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#d946ef', // fuchsia
    '#ec4899', // pink
    '#f43f5e', // rose
    '#64748b', // slate
];

/**
 * Create a new tag
 */
export async function createTag(name: string, color: string = '#6366f1'): Promise<Tag> {
    const response = await functions.createExecution(
        AppwriteConfig.functions.manageTags,
        JSON.stringify({ name, color }),
        false,
        '/',
        ExecutionMethod.POST
    );

    const result = safeParseJSON<ApiResponse<Tag>>(response.responseBody);
    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to create tag');
    }

    return result.data as Tag;
}

/**
 * List all user's tags
 */
export async function listTags(): Promise<{ tags: Tag[]; total: number }> {
    const response = await functions.createExecution(
        AppwriteConfig.functions.manageTags,
        '',
        false,
        '/',
        ExecutionMethod.GET
    );

    const result = safeParseJSON<ApiResponse<{ tags: Tag[]; total: number }>>(response.responseBody);
    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to list tags');
    }

    return result.data!;
}

/**
 * Update a tag
 */
export async function updateTag(tagId: string, updates: { name?: string; color?: string }): Promise<Tag> {
    const response = await functions.createExecution(
        AppwriteConfig.functions.manageTags,
        JSON.stringify(updates),
        false,
        `/${tagId}`,
        ExecutionMethod.PATCH
    );

    const result = safeParseJSON<ApiResponse<Tag>>(response.responseBody);
    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to update tag');
    }

    return result.data as Tag;
}

/**
 * Delete a tag
 */
export async function deleteTag(tagId: string): Promise<void> {
    const response = await functions.createExecution(
        AppwriteConfig.functions.manageTags,
        '',
        false,
        `/${tagId}`,
        ExecutionMethod.DELETE
    );

    const result = safeParseJSON<ApiResponse<{ deleted: boolean }>>(response.responseBody);
    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to delete tag');
    }
}

/**
 * Add a tag to a resource
 */
export async function addTagToResource(
    tagId: string,
    resourceType: 'file' | 'folder',
    resourceId: string
): Promise<ResourceTag> {
    const response = await functions.createExecution(
        AppwriteConfig.functions.manageTags,
        JSON.stringify({ tagId, resourceType, resourceId }),
        false,
        '/assign',
        ExecutionMethod.POST
    );

    const result = safeParseJSON<ApiResponse<ResourceTag>>(response.responseBody);
    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to add tag');
    }

    return result.data as ResourceTag;
}

/**
 * Remove a tag from a resource
 */
export async function removeTagFromResource(
    tagId: string,
    resourceType: 'file' | 'folder',
    resourceId: string
): Promise<void> {
    const response = await functions.createExecution(
        AppwriteConfig.functions.manageTags,
        JSON.stringify({ tagId, resourceType, resourceId }),
        false,
        '/unassign',
        ExecutionMethod.POST
    );

    const result = safeParseJSON<ApiResponse<{ removed: boolean }>>(response.responseBody);
    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to remove tag');
    }
}

/**
 * Get tags for a specific resource
 */
export async function getResourceTags(
    resourceType: 'file' | 'folder',
    resourceId: string
): Promise<Tag[]> {
    const response = await functions.createExecution(
        AppwriteConfig.functions.manageTags,
        '',
        false,
        `/resource/${resourceType}/${resourceId}`,
        ExecutionMethod.GET
    );

    const result = safeParseJSON<ApiResponse<{ tags: Tag[] }>>(response.responseBody);
    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to get tags');
    }

    return result.data?.tags ?? [];
}

/**
 * Get all resources with a specific tag
 */
export async function getResourcesByTag(tagId: string): Promise<{
    tag: Tag;
    files: any[];
    folders: any[];
    total: number;
}> {
    const response = await functions.createExecution(
        AppwriteConfig.functions.manageTags,
        '',
        false,
        `/tag/${tagId}/resources`,
        ExecutionMethod.GET
    );

    const result = safeParseJSON<ApiResponse<{
        tag: Tag;
        files: any[];
        folders: any[];
        total: number;
    }>>(response.responseBody);
    
    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to get resources');
    }

    return result.data!;
}
