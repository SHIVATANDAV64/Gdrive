

import {
    functions,
    databases,
    storage,
    AppwriteConfig,
    Query,
    ID
} from '@/lib/appwrite';
import { ExecutionMethod } from 'appwrite';
import type {
    FileDocument,
    FileWithUrl,
    UpdateFileInput,
} from '@/types';
import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from '@/lib/constants';
import { safeParseJSON } from '@/lib/utils';
import { FileDocumentSchema, RenameInputSchema, safeParse } from '@/lib/schemas';

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: { code: string; message: string };
}












export function validateFile(file: File): void {

    if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`File size exceeds maximum allowed (100MB)`);
    }

    // Relaxed validation: Check either MIME type OR extension
    const hasValidMime = ALLOWED_MIME_TYPES.includes(file.type as any);

    // Check extension for code files which might have text/plain or empty MIME
    const name = file.name.toLowerCase();
    const isCodeFile = /\.(js|jsx|ts|tsx|css|scss|html|json|md|py|java|c|cpp|h|cs|go|rs|php|rb|sh|yaml|yml|sql|xml)$/.test(name);

    if (!hasValidMime && !isCodeFile && file.type && file.type !== 'application/octet-stream') {
        // Only throw if generic binary or unknown distinct type, but allow "text/plain" fallback usually covered by code check
        // If it's completely empty mimeType, we often allow it if extension matches
        throw new Error(`File type "${file.type || 'unknown'}" is not supported`);
    }
}






export async function getFilesInFolder(
    folderId: string | null,
    ownerId: string, // Kept for signature compatibility
    page: number = 1,
    limit: number = 50
): Promise<{ files: FileDocument[]; total: number }> {
    try {
        const response = await functions.createExecution(
            AppwriteConfig.functions.fileOperations,
            '',
            false,
            `/?folderId=${folderId || ''}`,
            ExecutionMethod.GET
        );

        const result = safeParseJSON<ApiResponse<{ files: any[]; total: number }>>(response.responseBody);

        if (!result || !result.success) {
            console.error('[getFilesInFolder] Function error:', result?.error || response.responseBody);
            throw new Error(result?.error?.message ?? 'Failed to list files');
        }

        return {
            files: result.data!.files as unknown as FileDocument[],
            total: result.data!.total
        };
    } catch (error) {
        console.error('[getFilesInFolder] Error:', error);
        throw error;
    }
}


export async function getFile(fileId: string): Promise<FileDocument> {
    const response = await databases.getDocument(
        AppwriteConfig.databaseId,
        AppwriteConfig.collections.files,
        fileId
    );

    return response as unknown as FileDocument;
}


export async function getFileWithUrl(fileId: string): Promise<FileWithUrl> {
    const file = await getFile(fileId);


    const downloadUrl = storage.getFileDownload(
        AppwriteConfig.buckets.userFiles,
        file.storageKey
    ).toString();


    let previewUrl: string | undefined;
    if (file.mimeType.startsWith('image/')) {
        previewUrl = storage.getFilePreview(
            AppwriteConfig.buckets.userFiles,
            file.storageKey,
            400,
            400
        ).toString();
    }

    return {
        ...file,
        downloadUrl,
        previewUrl,
    };
}


export async function uploadFile(
    file: File,
    folderId: string | null,
    onProgress?: (progress: number) => void
): Promise<FileDocument> {

    validateFile(file);


    const storageKey = ID.unique();

    try {



        await storage.createFile(
            AppwriteConfig.buckets.userFiles,
            storageKey,
            file
        );


        onProgress?.(50);


        const response = await functions.createExecution(
            AppwriteConfig.functions.fileOperations,
            JSON.stringify({
                name: file.name,
                mimeType: file.type,
                sizeBytes: file.size,
                storageKey,
                folderId: folderId ?? null,
            }),
            false,
            '/',
            ExecutionMethod.POST
        );

        const result = safeParseJSON<ApiResponse<FileDocument>>(response.responseBody);

        if (!result || !result.success) {
            console.error('[uploadFile] Function error:', result?.error || response.responseBody);


            try {
                await storage.deleteFile(AppwriteConfig.buckets.userFiles, storageKey);
            } catch (cleanupError) {

                console.warn('[uploadFile] Cleanup failed (cleanUpError):', cleanupError);
            }

            throw new Error(result?.error?.message ?? `Failed to create file record: ${response.responseBody.substring(0, 100)}`);
        }

        onProgress?.(100);




        return result.data as FileDocument;
    } catch (error) {
        console.error('[uploadFile] Upload process failed:', error);


        if ((error as Error).message.includes('Failed to create file record') || (error as any).code === 400) {
            try {
                await storage.deleteFile(AppwriteConfig.buckets.userFiles, storageKey);
            } catch {

            }
        }
        throw error;
    }
}


export async function updateFile(
    fileId: string,
    input: UpdateFileInput
): Promise<FileDocument> {

    if (input.name !== undefined) {
        const validatedName = safeParse(RenameInputSchema, { name: input.name });
        if (!validatedName) {
            throw new Error('Invalid file name');
        }
    }

    const response = await functions.createExecution(
        AppwriteConfig.functions.fileOperations,
        JSON.stringify(input),
        false,
        `/${fileId}`,
        ExecutionMethod.PATCH
    );

    const result = safeParseJSON<ApiResponse<FileDocument>>(response.responseBody);

    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to update file');
    }


    const validatedFile = safeParse(FileDocumentSchema, result.data);
    if (!validatedFile) {
        console.warn('[updateFile] Response validation failed, returning raw data');
    }




    return result.data as FileDocument;
}

/**
 * Update file content (for text-based files)
 * Used by editors to save changes to shared files
 */
export async function updateFileContent(
    fileId: string,
    content: string
): Promise<FileDocument> {
    const response = await functions.createExecution(
        AppwriteConfig.functions.fileOperations,
        JSON.stringify({ content }),
        false,
        `/${fileId}/content`,
        ExecutionMethod.PUT
    );

    const result = safeParseJSON<ApiResponse<FileDocument>>(response.responseBody);

    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to save file content');
    }

    return result.data as FileDocument;
}


export async function deleteFile(fileId: string): Promise<void> {
    // Soft delete by setting isDeleted to true
    await updateFile(fileId, { isDeleted: true });
}


export async function downloadFile(fileId: string): Promise<void> {
    const file = await getFileWithUrl(fileId);


    const link = document.createElement('a');
    link.href = file.downloadUrl;
    link.download = file.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


export async function getRecentFiles(ownerId: string, limit: number = 20): Promise<FileDocument[]> {
    const response = await databases.listDocuments(
        AppwriteConfig.databaseId,
        AppwriteConfig.collections.files,
        [
            Query.equal('ownerId', ownerId),
            Query.equal('isDeleted', false),
            Query.orderDesc('$updatedAt'),
            Query.limit(limit),
        ]
    );

    return response.documents as unknown as FileDocument[];
}


export async function deleteFiles(fileIds: string[]): Promise<void> {
    const results = await Promise.allSettled(
        fileIds.map(id => deleteFile(id))
    );


    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
        throw new Error(`Failed to delete ${failures.length} file(s)`);
    }
}


export async function moveFiles(
    fileIds: string[],
    targetFolderId: string | null
): Promise<void> {
    const results = await Promise.allSettled(
        fileIds.map(id => updateFile(id, { folderId: targetFolderId }))
    );

    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
        throw new Error(`Failed to move ${failures.length} file(s)`);
    }
}






export function invalidateFileCache(folderId?: string | null): void {

}
