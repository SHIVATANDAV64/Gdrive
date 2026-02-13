 

import { functions, AppwriteConfig } from '@/lib/appwrite';
import { ExecutionMethod } from 'appwrite';
import { safeParseJSON } from '@/lib/utils';
import type { FileDocument } from '@/types';





export interface FileVersion {
    $id: string;
    fileId: string;
    versionNumber: number;
    storageKey: string;
    sizeBytes: number;
    checksum: string | null;
    createdAt: string;
    createdBy: string;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code?: string;
    };
}





 
export async function getFileVersions(fileId: string): Promise<FileVersion[]> {
    const response = await functions.createExecution(
        AppwriteConfig.functions.fileOperations,
        JSON.stringify({ fileId }),
        false,
        `/${fileId}/versions`,
        ExecutionMethod.GET
    );

    const result = safeParseJSON<ApiResponse<FileVersion[]>>(response.responseBody);

    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to get file versions');
    }

    return result.data ?? [];
}

 
export async function createFileVersion(
    fileId: string,
    file: File
): Promise<FileDocument> {
    
    const response = await functions.createExecution(
        AppwriteConfig.functions.fileOperations,
        JSON.stringify({
            name: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
        }),
        false,
        `/${fileId}/versions`,
        ExecutionMethod.POST
    );

    const result = safeParseJSON<ApiResponse<FileDocument>>(response.responseBody);

    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to create file version');
    }

    return result.data as FileDocument;
}

 
export async function restoreFileVersion(
    fileId: string,
    versionId: string
): Promise<FileDocument> {
    const response = await functions.createExecution(
        AppwriteConfig.functions.fileOperations,
        JSON.stringify({ versionId }),
        false,
        `/${fileId}/versions/restore`,
        ExecutionMethod.POST
    );

    const result = safeParseJSON<ApiResponse<FileDocument>>(response.responseBody);

    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to restore file version');
    }

    return result.data as FileDocument;
}

 
export async function deleteFileVersion(
    fileId: string,
    versionId: string
): Promise<void> {
    const response = await functions.createExecution(
        AppwriteConfig.functions.fileOperations,
        undefined,
        false,
        `/${fileId}/versions/${versionId}`,
        ExecutionMethod.DELETE
    );

    const result = safeParseJSON<ApiResponse<void>>(response.responseBody);

    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to delete file version');
    }
}

 
export async function getVersionCount(fileId: string): Promise<number> {
    const versions = await getFileVersions(fileId);
    return versions.length;
}

export default {
    getFileVersions,
    createFileVersion,
    restoreFileVersion,
    deleteFileVersion,
    getVersionCount,
};
