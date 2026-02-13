

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import * as fileService from '@/services/file.service';
import type { UpdateFileInput } from '@/types';
import { useAuth } from '@/hooks/useAuth';






export function useFilesInFolder(folderId: string | null, pageSize: number = 20) {
    const { user } = useAuth();

    return useInfiniteQuery({
        queryKey: [...QUERY_KEYS.folders.contents(folderId), 'files', { pageSize }] as const,
        queryFn: ({ pageParam }) => {
            if (!user) throw new Error("User not authenticated");
            return fileService.getFilesInFolder(folderId, user.$id, pageParam as number, pageSize);
        },
        enabled: !!user,
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            const fetchedCount = allPages.flatMap(p => p.files).length;
            if (fetchedCount < lastPage.total) {
                return allPages.length + 1;
            }
            return undefined;
        },
        staleTime: 30 * 1000,
    });
}






export function useFile(fileId: string | null) {
    return useQuery({
        queryKey: fileId ? QUERY_KEYS.files.detail(fileId) : ['files', 'null'],
        queryFn: () => fileId ? fileService.getFileWithUrl(fileId) : null,
        enabled: !!fileId,
    });
}






export function useRecentFiles(limit: number = 20) {
    const { user } = useAuth();

    return useQuery({
        queryKey: QUERY_KEYS.recent.all,
        queryFn: () => {
            if (!user) throw new Error("User not authenticated");
            return fileService.getRecentFiles(user.$id, limit);
        },
        enabled: !!user,
        staleTime: 60 * 1000,
    });
}






export function useFileMutations() {
    const queryClient = useQueryClient();


    const uploadFile = useMutation({
        mutationFn: ({
            file,
            folderId,
            onProgress
        }: {
            file: File;
            folderId: string | null;
            onProgress?: (progress: number) => void;
        }) => fileService.uploadFile(file, folderId, onProgress),
        onSuccess: (newFile) => {

            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.folders.contents(newFile.folderId),
            });

            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.recent.all,
            });
        },
    });


    const updateFile = useMutation({
        mutationFn: ({ fileId, input }: { fileId: string; input: UpdateFileInput }) =>
            fileService.updateFile(fileId, input),
        onSuccess: (updatedFile) => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.files.detail(updatedFile.$id),
            });

            queryClient.invalidateQueries({
                queryKey: ['folders', 'contents'],
            });
        },
    });


    const deleteFile = useMutation({
        mutationFn: (fileId: string) => fileService.deleteFile(fileId),
        onSuccess: () => {

            queryClient.invalidateQueries({
                queryKey: ['folders', 'contents'],
            });

            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.trash.all,
            });

            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.storage,
            });
        },
    });


    const downloadFile = useMutation({
        mutationFn: (fileId: string) => fileService.downloadFile(fileId),
    });


    const deleteFiles = useMutation({
        mutationFn: (fileIds: string[]) => fileService.deleteFiles(fileIds),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['folders', 'contents'],
            });

            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.storage,
            });
        },
    });


    const moveFiles = useMutation({
        mutationFn: ({ fileIds, targetFolderId }: { fileIds: string[]; targetFolderId: string | null }) =>
            fileService.moveFiles(fileIds, targetFolderId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['folders', 'contents'],
            });
        },
    });

    return {
        uploadFile: uploadFile.mutateAsync,
        updateFile: updateFile.mutateAsync,
        deleteFile: deleteFile.mutateAsync,
        downloadFile: downloadFile.mutateAsync,
        deleteFiles: deleteFiles.mutateAsync,
        moveFiles: moveFiles.mutateAsync,
        isUploading: uploadFile.isPending,
        isUpdating: updateFile.isPending,
        isDeleting: deleteFile.isPending || deleteFiles.isPending,
        isDownloading: downloadFile.isPending,
        isMoving: moveFiles.isPending,
        uploadError: uploadFile.error,
        updateError: updateFile.error,
        deleteError: deleteFile.error,
    };
}






export function useFiles(folderId: string | null) {
    const filesQuery = useFilesInFolder(folderId);
    const mutations = useFileMutations();

    const files = filesQuery.data?.pages.flatMap(page => page.files) ?? [];

    return {
        files,
        isLoading: filesQuery.isLoading,
        isFetching: filesQuery.isFetching,
        error: filesQuery.error,
        refetch: filesQuery.refetch,
        loadMore: filesQuery.fetchNextPage,
        hasNextPage: filesQuery.hasNextPage,
        isFetchingNextPage: filesQuery.isFetchingNextPage,
        ...mutations,
    };
}
