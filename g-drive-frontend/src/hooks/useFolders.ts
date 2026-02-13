

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import * as folderService from '@/services/folder.service';
import type { CreateFolderInput, UpdateFolderInput, BreadcrumbItem } from '@/types';
import { useAuth } from '@/hooks/useAuth';






export function useFolderContents(folderId: string | null) {
    const { user } = useAuth();

    return useQuery({
        queryKey: QUERY_KEYS.folders.contents(folderId),
        queryFn: () => {
            if (!user) throw new Error("User not authenticated");
            return folderService.getFolderContents(folderId, user.$id);
        },
        enabled: !!user,
        staleTime: 30 * 1000,
    });
}






export function useFolder(folderId: string | null) {
    return useQuery({
        queryKey: folderId ? QUERY_KEYS.folders.detail(folderId) : ['folders', 'null'],
        queryFn: () => folderId ? folderService.getFolder(folderId) : null,
        enabled: !!folderId,
    });
}






export function useFolderPath(folderId: string | null): BreadcrumbItem[] {
    const { data } = useFolderContents(folderId);
    return data?.path ?? [{ id: null, name: 'My Drive' }];
}






export function useAllFolders() {
    const { user } = useAuth();

    return useQuery({
        queryKey: QUERY_KEYS.folders.all,
        queryFn: () => {
            if (!user) throw new Error("User not authenticated");
            return folderService.listAllFolders(user.$id);
        },
        enabled: !!user,
        staleTime: 60 * 1000,
    });
}






export function useFolderMutations() {
    const queryClient = useQueryClient();


    const createFolder = useMutation({
        mutationFn: (input: CreateFolderInput) => folderService.createFolder(input),
        onSuccess: (newFolder) => {

            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.folders.contents(newFolder.parentId),
            });

            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.folders.all,
            });
        },
    });


    const updateFolder = useMutation({
        mutationFn: ({ folderId, input }: { folderId: string; input: UpdateFolderInput }) =>
            folderService.updateFolder(folderId, input),
        onSuccess: (updatedFolder, { input }) => {

            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.folders.detail(updatedFolder.$id),
            });


            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.folders.contents(updatedFolder.parentId),
            });


            if (input.parentId !== undefined) {
                queryClient.invalidateQueries({
                    queryKey: QUERY_KEYS.folders.all,
                });

                queryClient.invalidateQueries({
                    queryKey: ['folders', 'contents'],
                });
            }


            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.folders.contents(null),
            });
        },
    });


    const deleteFolder = useMutation({
        mutationFn: (folderId: string) => folderService.deleteFolder(folderId),
        onSuccess: (_, _folderId) => {

            queryClient.invalidateQueries({
                queryKey: ['folders'],
            });
        },
    });

    return {
        createFolder: createFolder.mutateAsync,
        updateFolder: updateFolder.mutateAsync,
        deleteFolder: deleteFolder.mutateAsync,
        isCreating: createFolder.isPending,
        isUpdating: updateFolder.isPending,
        isDeleting: deleteFolder.isPending,
        createError: createFolder.error,
        updateError: updateFolder.error,
        deleteError: deleteFolder.error,
    };
}






export function useFolders(folderId: string | null) {
    const contents = useFolderContents(folderId);
    const mutations = useFolderMutations();

    return {

        folder: contents.data?.folder ?? null,
        folders: contents.data?.folders ?? [],
        path: contents.data?.path ?? [{ id: null, name: 'My Drive' }],


        isLoading: contents.isLoading,
        isFetching: contents.isFetching,
        error: contents.error,
        refetch: contents.refetch,


        ...mutations,
    };
}
