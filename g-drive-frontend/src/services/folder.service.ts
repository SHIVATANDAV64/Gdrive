

import { functions, databases, AppwriteConfig, Query } from '@/lib/appwrite';
import { ExecutionMethod } from 'appwrite';
import type {
    Folder,
    CreateFolderInput,
    UpdateFolderInput,
    BreadcrumbItem,
} from '@/types';
import { safeParseJSON, getValidationErrorMessage } from '@/lib/utils';
import { FolderCreateInputSchema, RenameInputSchema, FolderSchema, safeParse } from '@/lib/schemas';

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: { code: string; message: string };
}





interface FolderContents {
    folder: Folder | null;
    folders: Folder[];
    files: never[];
    path: BreadcrumbItem[];
}






export async function getFolderContents(folderId: string | null, ownerId: string): Promise<FolderContents> {
    try {
        const response = await functions.createExecution(
            AppwriteConfig.functions.folderCrud,
            '',
            false,
            `/?parentId=${folderId || ''}`,
            ExecutionMethod.GET
        );

        const result = safeParseJSON<ApiResponse<{ folders: any[]; total: number }>>(response.responseBody);

        if (!result || !result.success) {
            console.error('[getFolderContents] Function error:', result?.error || response.responseBody);
            throw new Error(result?.error?.message ?? 'Failed to list folders');
        }

        const folders = result.data!.folders as unknown as Folder[];

        let folder: Folder | null = null;
        let path: BreadcrumbItem[] = [{ id: null, name: 'My Drive' }];

        if (folderId) {
            const [folderResult, pathResult] = await Promise.all([
                getFolder(folderId),
                getFolderPath(folderId)
            ]);
            folder = folderResult;
            path = pathResult;
        }

        return {
            folder,
            folders,
            files: [],
            path,
        };
    } catch (error) {
        console.error('[getFolderContents] Error:', error);
        throw error;
    }
}


export async function getFolder(folderId: string): Promise<Folder> {
    const response = await databases.getDocument(
        AppwriteConfig.databaseId,
        AppwriteConfig.collections.folders,
        folderId
    );

    return response as unknown as Folder;
}


export async function getFolderPath(folderId: string): Promise<BreadcrumbItem[]> {
    const path: BreadcrumbItem[] = [{ id: null, name: 'My Drive' }];
    let currentId: string | null = folderId;


    const maxDepth = 10;
    let depth = 0;

    while (currentId && depth < maxDepth) {
        try {
            const folder = await getFolder(currentId);
            path.push({ id: folder.$id, name: folder.name });
            currentId = folder.parentId;
            depth++;
        } catch {
            break;
        }
    }


    return path;
}


export async function createFolder(input: CreateFolderInput): Promise<Folder> {

    const validationError = getValidationErrorMessage(FolderCreateInputSchema, input);
    if (validationError) {
        throw new Error(`Validation failed: ${validationError}`);
    }

    const validatedInput = safeParse(FolderCreateInputSchema, input);
    if (!validatedInput) {
        throw new Error('Failed to parse folder input');
    }


    const response = await functions.createExecution(
        AppwriteConfig.functions.folderCrud,
        JSON.stringify({
            name: validatedInput.name.trim(),
            parentId: validatedInput.parentId ?? null,
        }),
        false,
        '/',
        ExecutionMethod.POST
    );

    const result = safeParseJSON<ApiResponse<Folder>>(response.responseBody);

    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to create folder');
    }


    const validatedFolder = safeParse(FolderSchema, result.data);
    if (!validatedFolder) {
        console.warn('[createFolder] Response validation failed, returning raw data');
    }

    return result.data as Folder;
}


export async function updateFolder(
    folderId: string,
    input: UpdateFolderInput
): Promise<Folder> {

    if (input.name !== undefined) {
        const validationError = getValidationErrorMessage(RenameInputSchema, { name: input.name });
        if (validationError) {
            throw new Error(`Validation failed: ${validationError}`);
        }
    }

    const response = await functions.createExecution(
        AppwriteConfig.functions.folderCrud,
        JSON.stringify(input),
        false,
        `/${folderId}`,
        ExecutionMethod.PATCH
    );

    const result = safeParseJSON<ApiResponse<Folder>>(response.responseBody);

    if (!result || !result.success) {
        throw new Error(result?.error?.message ?? 'Failed to update folder');
    }


    const validatedFolder = safeParse(FolderSchema, result.data);
    if (!validatedFolder) {
        console.warn('[updateFolder] Response validation failed, returning raw data');
    }

    return result.data as Folder;
}


export async function deleteFolder(folderId: string): Promise<void> {
    // Soft delete by setting isDeleted to true
    await updateFolder(folderId, { isDeleted: true });
}


export async function listAllFolders(ownerId: string): Promise<Folder[]> {
    const response = await databases.listDocuments(
        AppwriteConfig.databaseId,
        AppwriteConfig.collections.folders,
        [
            Query.equal('ownerId', ownerId),
            Query.equal('isDeleted', false),
            Query.orderAsc('name'),
            Query.limit(500),
        ]
    );

    return response.documents as unknown as Folder[];
}


export async function checkFolderNameExists(
    name: string,
    parentId: string | null
): Promise<boolean> {
    const queries = [
        Query.equal('name', name),
        Query.equal('isDeleted', false),
        Query.limit(1),
    ];

    if (parentId === null) {
        queries.push(Query.isNull('parentId'));
    } else {
        queries.push(Query.equal('parentId', parentId));
    }

    const response = await databases.listDocuments(
        AppwriteConfig.databaseId,
        AppwriteConfig.collections.folders,
        queries
    );

    return response.total > 0;
}
