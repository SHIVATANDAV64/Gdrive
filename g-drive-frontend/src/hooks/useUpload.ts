 

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { uploadFile, validateFile } from '@/services/file.service';
import { QUERY_KEYS } from '@/lib/constants';
import { generateTempId } from '@/lib/utils';
import type { FileDocument } from '@/types';





interface UploadItem {
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
    result?: FileDocument;
}

interface UseUploadOptions {
    folderId?: string | null;
    onSuccess?: (file: FileDocument) => void;
    onError?: (error: Error, file: File) => void;
    onComplete?: () => void;
}

interface UseUploadReturn {
    uploads: UploadItem[];
    isUploading: boolean;
    uploadFiles: (files: File[]) => void;
    cancelUpload: (id: string) => void;
    clearCompleted: () => void;
    clearAll: () => void;
}





export function useUpload(options: UseUploadOptions = {}): UseUploadReturn {
    const { folderId = null, onSuccess, onError, onComplete } = options;
    const queryClient = useQueryClient();

    const [uploads, setUploads] = useState<UploadItem[]>([]);

    
    const isUploading = uploads.some((u) => u.status === 'uploading' || u.status === 'pending');

    
    const uploadSingleFile = useCallback(async (item: UploadItem): Promise<void> => {
        
        setUploads((prev) =>
            prev.map((u) =>
                u.id === item.id ? { ...u, status: 'uploading' as const } : u
            )
        );

        try {
            
            validateFile(item.file);

            
            const result = await uploadFile(item.file, folderId, (progress) => {
                setUploads((prev) =>
                    prev.map((u) =>
                        u.id === item.id ? { ...u, progress } : u
                    )
                );
            });

            
            setUploads((prev) =>
                prev.map((u) =>
                    u.id === item.id
                        ? { ...u, status: 'success' as const, progress: 100, result }
                        : u
                )
            );

            
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.files.inFolder(folderId),
            });

            onSuccess?.(result);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Upload failed';

            setUploads((prev) =>
                prev.map((u) =>
                    u.id === item.id
                        ? { ...u, status: 'error' as const, error: errorMessage }
                        : u
                )
            );

            onError?.(error instanceof Error ? error : new Error(errorMessage), item.file);
        }
    }, [folderId, queryClient, onSuccess, onError]);

    
    const uploadFiles = useCallback(async (files: File[]) => {
        
        const newItems: UploadItem[] = files.map((file) => ({
            id: generateTempId(),
            file,
            progress: 0,
            status: 'pending' as const,
        }));

        
        setUploads((prev) => [...prev, ...newItems]);

        
        for (const item of newItems) {
            
            const current = uploads.find((u) => u.id === item.id);
            if (current?.status === 'error') continue;

            await uploadSingleFile(item);
        }

        onComplete?.();
    }, [uploadSingleFile, uploads, onComplete]);

    
    const cancelUpload = useCallback((id: string) => {
        setUploads((prev) =>
            prev.map((u) =>
                u.id === id && (u.status === 'pending' || u.status === 'uploading')
                    ? { ...u, status: 'error' as const, error: 'Cancelled' }
                    : u
            )
        );
    }, []);

    
    const clearCompleted = useCallback(() => {
        setUploads((prev) =>
            prev.filter((u) => u.status === 'pending' || u.status === 'uploading')
        );
    }, []);

    
    const clearAll = useCallback(() => {
        setUploads([]);
    }, []);

    return {
        uploads,
        isUploading,
        uploadFiles,
        cancelUpload,
        clearCompleted,
        clearAll,
    };
}

export default useUpload;
