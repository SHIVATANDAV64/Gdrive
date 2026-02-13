

import { functions, databases, AppwriteConfig, Query } from '@/lib/appwrite';
import { ExecutionMethod } from 'appwrite';
import type { Share, LinkShare, FileDocument, Folder, ResolvedLinkShare } from '@/types';
import { safeParseJSON } from '@/lib/utils';

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: { code: string; message: string };
}





interface CreateShareInput {
    resourceType: 'file' | 'folder';
    resourceId: string;
    granteeEmail: string;
    role: 'viewer' | 'editor';
}

interface CreateLinkInput {
    resourceType: 'file' | 'folder';
    resourceId: string;
    role?: 'viewer' | 'editor';
    password?: string;
    expiresAt?: string;
}


interface StarredItem {
    star: {
        $id: string;
        userId: string;
        resourceType: 'file' | 'folder';
        resourceId: string;
    };
    resource: FileDocument | Folder;
    resourceType: 'file' | 'folder';
}






export async function getShares(
    resourceType: 'file' | 'folder',
    resourceId: string
): Promise<(Share & { granteeUser?: { email: string; name: string } })[]> {
    const response = await databases.listDocuments(
        AppwriteConfig.databaseId,
        AppwriteConfig.collections.shares,
        [
            Query.equal('resourceType', resourceType),
            Query.equal('resourceId', resourceId),
        ]
    );

    const shares = response.documents as unknown as Share[];

    if (shares.length === 0) return [];

    // Resolve user IDs to emails
    const userIds = Array.from(new Set(shares.map(s => s.granteeUserId)));

    try {
        const usersResponse = await databases.listDocuments(
            AppwriteConfig.databaseId,
            AppwriteConfig.collections.users,
            [Query.equal('$id', userIds)]
        );

        const userMap = new Map(usersResponse.documents.map(u => [u.$id, u]));

        return shares.map(share => ({
            ...share,
            granteeUser: userMap.has(share.granteeUserId)
                ? {
                    email: (userMap.get(share.granteeUserId) as any).email,
                    name: (userMap.get(share.granteeUserId) as any).name
                }
                : undefined
        }));
    } catch (error) {
        console.error('[shareService] Failed to resolve grantee users:', error);
        return shares; // Fallback to raw shares
    }
}


export async function getSharedWithMe(): Promise<Share[]> {

    const response = await functions.createExecution(
        AppwriteConfig.functions.manageShares,
        '',
        false,
        '/?sharedWithMe=true',
        ExecutionMethod.GET
    );

    const result = safeParseJSON<ApiResponse<Share[]>>(response.responseBody);
    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to get shared items');
    }

    return (result.data as Share[]) ?? [];
}


export async function createShare(input: CreateShareInput): Promise<Share> {
    const response = await functions.createExecution(
        AppwriteConfig.functions.manageShares,
        JSON.stringify(input),
        false,
        '/',
        ExecutionMethod.POST
    );

    const result = safeParseJSON<ApiResponse<Share>>(response.responseBody);
    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to create share');
    }

    return result.data as Share;
}


export async function updateShare(
    shareId: string,
    role: 'viewer' | 'editor'
): Promise<Share> {
    const response = await functions.createExecution(
        AppwriteConfig.functions.manageShares,
        JSON.stringify({ role }),
        false,
        `/${shareId}`,
        ExecutionMethod.PATCH
    );

    const result = safeParseJSON<ApiResponse<Share>>(response.responseBody);
    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to update share');
    }

    return result.data as Share;
}


export async function deleteShare(shareId: string): Promise<void> {
    const response = await functions.createExecution(
        AppwriteConfig.functions.manageShares,
        '',
        false,
        `/${shareId}`,
        ExecutionMethod.DELETE
    );

    const result = safeParseJSON<ApiResponse>(response.responseBody);
    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to delete share');
    }
}






export async function getLinkShare(
    resourceType: 'file' | 'folder',
    resourceId: string
): Promise<LinkShare | null> {
    const response = await databases.listDocuments(
        AppwriteConfig.databaseId,
        AppwriteConfig.collections.linkShares,
        [
            Query.equal('resourceType', resourceType),
            Query.equal('resourceId', resourceId),
            Query.limit(1),
        ]
    );

    if (response.total === 0) return null;
    return response.documents[0] as unknown as LinkShare;
}


export async function createLinkShare(input: CreateLinkInput): Promise<LinkShare> {
    const response = await functions.createExecution(
        AppwriteConfig.functions.manageLinks,
        JSON.stringify(input),
        false,
        '/',
        ExecutionMethod.POST
    );

    const result = safeParseJSON<ApiResponse<LinkShare>>(response.responseBody);
    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to create link');
    }

    return result.data as LinkShare;
}


export async function resolveLinkShare(
    token: string,
    password?: string
): Promise<ResolvedLinkShare> {
    const response = await functions.createExecution(
        AppwriteConfig.functions.manageLinks,
        password ? JSON.stringify({ password }) : '',
        false,
        `/${token}`,
        ExecutionMethod.POST
    );

    const result = safeParseJSON<ApiResponse<ResolvedLinkShare>>(response.responseBody);
    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to resolve link');
    }

    return result.data!;
}


export async function deleteLinkShare(linkId: string): Promise<void> {
    const response = await functions.createExecution(
        AppwriteConfig.functions.manageLinks,
        '',
        false,
        `/${linkId}`,
        ExecutionMethod.DELETE
    );

    const result = safeParseJSON<ApiResponse>(response.responseBody);
    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to delete link');
    }
}






export async function starItem(
    resourceType: 'file' | 'folder',
    resourceId: string
): Promise<void> {
    const response = await functions.createExecution(
        AppwriteConfig.functions.manageStars,
        JSON.stringify({ resourceType, resourceId }),
        false,
        '/',
        ExecutionMethod.POST
    );

    const result = safeParseJSON<ApiResponse>(response.responseBody);
    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to star item');
    }
}


export async function unstarItem(starId: string): Promise<void> {
    const response = await functions.createExecution(
        AppwriteConfig.functions.manageStars,
        '',
        false,
        `/${starId}`,
        ExecutionMethod.DELETE
    );

    const result = safeParseJSON<ApiResponse>(response.responseBody);
    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to unstar item');
    }
}


export async function unstarByResource(
    resourceType: 'file' | 'folder',
    resourceId: string
): Promise<void> {
    const response = await functions.createExecution(
        AppwriteConfig.functions.manageStars,
        JSON.stringify({ resourceType, resourceId }),
        false,
        '/unstar',
        ExecutionMethod.POST
    );

    const result = safeParseJSON<ApiResponse>(response.responseBody);
    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to unstar item');
    }
}


export async function getStarredItems(): Promise<StarredItem[]> {
    const response = await functions.createExecution(
        AppwriteConfig.functions.manageStars,
        '',
        false,
        '/',
        ExecutionMethod.GET
    );

    const result = safeParseJSON<ApiResponse<{ items: StarredItem[] }>>(response.responseBody);
    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to get starred items');
    }

    return result.data?.items ?? [];
}


export async function isItemStarred(
    resourceType: 'file' | 'folder',
    resourceId: string
): Promise<{ isStarred: boolean; starId: string | null }> {
    const response = await functions.createExecution(
        AppwriteConfig.functions.manageStars,
        '',
        false,
        `/?resourceType=${resourceType}&resourceId=${resourceId}`,
        ExecutionMethod.GET
    );

    const result = safeParseJSON<ApiResponse<{ isStarred: boolean; starId: string | null }>>(response.responseBody);
    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to check starred status');
    }

    return result.data!;
}

export const shareService = {
    getShares,
    getSharedWithMe,
    createShare,
    updateShare,
    deleteShare,
    getLinkShare,
    createLinkShare,
    resolveLinkShare,
    deleteLinkShare,
    starItem,
    unstarItem,
    unstarByResource,
    isItemStarred,
    getStarredItems,
};

export default shareService;
