 

import { functions, databases, AppwriteConfig, Query } from '@/lib/appwrite';
import type { FileDocument, Folder, SearchFilters } from '@/types';
import { safeParseJSON } from '@/lib/utils';

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: { code: string; message: string };
}





interface SearchParams {
    query: string;
    filters?: SearchFilters;
    limit?: number;
    offset?: number;
}

interface SearchResponse {
    files: FileDocument[];
    folders: Folder[];
    total: number;
}





 
export async function search(params: SearchParams): Promise<SearchResponse> {
    const { query, filters = {}, limit = 50, offset = 0 } = params;

    
    const response = await functions.createExecution(
        AppwriteConfig.functions.searchFiles,
        JSON.stringify({
            query,
            filters,
            limit,
            offset,
        }),
        false
    );

    const result = safeParseJSON<ApiResponse<SearchResponse>>(response.responseBody);
    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Search failed');
    }

    return result.data as SearchResponse;
}

 
export async function quickSearch(query: string, limit = 20): Promise<FileDocument[]> {
    if (!query.trim()) return [];

    const response = await databases.listDocuments(
        AppwriteConfig.databaseId,
        AppwriteConfig.collections.files,
        [
            Query.search('name', query),
            Query.equal('isDeleted', false),
            Query.limit(limit),
        ]
    );

    return response.documents as unknown as FileDocument[];
}

 
export async function searchByType(
    mimeTypePrefix: string,
    limit = 50
): Promise<FileDocument[]> {
    const response = await databases.listDocuments(
        AppwriteConfig.databaseId,
        AppwriteConfig.collections.files,
        [
            Query.startsWith('mimeType', mimeTypePrefix),
            Query.equal('isDeleted', false),
            Query.orderDesc('$updatedAt'),
            Query.limit(limit),
        ]
    );

    return response.documents as unknown as FileDocument[];
}

 
export async function getImages(limit = 50): Promise<FileDocument[]> {
    return searchByType('image/', limit);
}

 
export async function getVideos(limit = 50): Promise<FileDocument[]> {
    return searchByType('video/', limit);
}

 
export async function getDocuments(limit = 50): Promise<FileDocument[]> {
    const response = await databases.listDocuments(
        AppwriteConfig.databaseId,
        AppwriteConfig.collections.files,
        [
            Query.equal('isDeleted', false),
            Query.orderDesc('$updatedAt'),
            Query.limit(limit),
        ]
    );

    
    const docs = response.documents as unknown as FileDocument[];
    return docs.filter((f) =>
        f.mimeType === 'application/pdf' ||
        f.mimeType.includes('document') ||
        f.mimeType.includes('sheet') ||
        f.mimeType.includes('presentation') ||
        f.mimeType === 'text/plain' ||
        f.mimeType === 'text/markdown'
    );
}

 
export async function searchFolders(query: string, limit = 20): Promise<Folder[]> {
    if (!query.trim()) return [];

    const response = await databases.listDocuments(
        AppwriteConfig.databaseId,
        AppwriteConfig.collections.folders,
        [
            Query.search('name', query),
            Query.equal('isDeleted', false),
            Query.limit(limit),
        ]
    );

    return response.documents as unknown as Folder[];
}

 
export async function getFilesBySize(
    minBytes?: number,
    maxBytes?: number,
    limit = 50
): Promise<FileDocument[]> {
    const queries = [
        Query.equal('isDeleted', false),
        Query.orderDesc('sizeBytes'),
        Query.limit(limit),
    ];

    if (minBytes !== undefined) {
        queries.push(Query.greaterThanEqual('sizeBytes', minBytes));
    }
    if (maxBytes !== undefined) {
        queries.push(Query.lessThanEqual('sizeBytes', maxBytes));
    }

    const response = await databases.listDocuments(
        AppwriteConfig.databaseId,
        AppwriteConfig.collections.files,
        queries
    );

    return response.documents as unknown as FileDocument[];
}

export const searchService = {
    search,
    quickSearch,
    searchByType,
    getImages,
    getVideos,
    getDocuments,
    searchFolders,
    getFilesBySize,
};

export default searchService;
