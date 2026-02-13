

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteFiles, moveFiles, downloadFile } from '@/services/file.service';
import { deleteFolder } from '@/services/folder.service';
import { starItem, unstarByResource } from '@/services/share.service';





interface BulkItem {
    id: string;
    type: 'file' | 'folder';
    name: string;
}

interface BulkOperationsState {
    selectedItems: BulkItem[];
    isAllSelected: boolean;
}

interface UseBulkOperationsOptions {
    onSuccess?: (operation: string, count: number) => void;
    onError?: (error: Error, operation: string) => void;
}

interface UseBulkOperationsReturn {
    selectedItems: BulkItem[];
    isAllSelected: boolean;
    selectedCount: number;
    hasSelection: boolean;
    selectItem: (item: BulkItem) => void;
    deselectItem: (id: string) => void;
    toggleItem: (item: BulkItem) => void;
    selectAll: (items: BulkItem[]) => void;
    deselectAll: () => void;
    isSelected: (id: string) => boolean;
    bulkDelete: () => Promise<void>;
    bulkMove: (targetFolderId: string) => Promise<void>;
    bulkDownload: () => Promise<void>;
    bulkStar: () => Promise<void>;
    bulkUnstar: () => Promise<void>;
    isDeleting: boolean;
    isMoving: boolean;
    isDownloading: boolean;
    isStarring: boolean;
}





export function useBulkOperations(options: UseBulkOperationsOptions = {}): UseBulkOperationsReturn {
    const { onSuccess, onError } = options;
    const [state, setState] = useState<BulkOperationsState>({
        selectedItems: [],
        isAllSelected: false,
    });
    const queryClient = useQueryClient();


    const selectItem = useCallback((item: BulkItem) => {
        setState(prev => ({
            ...prev,
            selectedItems: [...prev.selectedItems.filter(i => i.id !== item.id), item],
            isAllSelected: false,
        }));
    }, []);

    const deselectItem = useCallback((id: string) => {
        setState(prev => ({
            ...prev,
            selectedItems: prev.selectedItems.filter(i => i.id !== id),
            isAllSelected: false,
        }));
    }, []);

    const toggleItem = useCallback((item: BulkItem) => {
        setState(prev => {
            const isCurrentlySelected = prev.selectedItems.some(i => i.id === item.id);
            return {
                ...prev,
                selectedItems: isCurrentlySelected
                    ? prev.selectedItems.filter(i => i.id !== item.id)
                    : [...prev.selectedItems, item],
                isAllSelected: false,
            };
        });
    }, []);

    const selectAll = useCallback((items: BulkItem[]) => {
        setState({
            selectedItems: items,
            isAllSelected: true,
        });
    }, []);

    const deselectAll = useCallback(() => {
        setState({
            selectedItems: [],
            isAllSelected: false,
        });
    }, []);

    const isSelected = useCallback((id: string) => {
        return state.selectedItems.some(i => i.id === id);
    }, [state.selectedItems]);


    const deleteMutation = useMutation({
        mutationFn: async (items: BulkItem[]) => {
            const fileIds = items.filter(i => i.type === 'file').map(i => i.id);
            const folderIds = items.filter(i => i.type === 'folder').map(i => i.id);

            const promises: Promise<void>[] = [];

            if (fileIds.length > 0) {
                promises.push(deleteFiles(fileIds));
            }

            for (const folderId of folderIds) {
                promises.push(deleteFolder(folderId));
            }

            await Promise.all(promises);
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            queryClient.invalidateQueries({ queryKey: ['folders'] });
            const count = variables.length;
            deselectAll();
            onSuccess?.('delete', count);
        },
        onError: (error: Error) => {
            onError?.(error, 'delete');
        },
    });


    const moveMutation = useMutation({
        mutationFn: async ({ items, targetFolderId }: { items: BulkItem[]; targetFolderId: string }) => {
            const fileIds = items.filter(i => i.type === 'file').map(i => i.id);

            if (fileIds.length > 0) {
                await moveFiles(fileIds, targetFolderId);
            }
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            queryClient.invalidateQueries({ queryKey: ['folders'] });
            const count = variables.items.length;
            deselectAll();
            onSuccess?.('move', count);
        },
        onError: (error: Error) => {
            onError?.(error, 'move');
        },
    });


    const [isDownloading, setIsDownloading] = useState(false);
    const bulkDownload = useCallback(async () => {
        setIsDownloading(true);
        try {
            const fileItems = state.selectedItems.filter(i => i.type === 'file');
            for (const item of fileItems) {

                await downloadFile(item.id);
            }
            onSuccess?.('download', fileItems.length);
        } catch (error) {
            onError?.(error as Error, 'download');
        } finally {
            setIsDownloading(false);
        }
    }, [state.selectedItems, onSuccess, onError]);



    const starMutation = useMutation({
        mutationFn: async ({ items, star }: { items: BulkItem[]; star: boolean }) => {
            if (star) {
                const promises = items.map(item =>
                    starItem(item.type, item.id)
                );
                await Promise.all(promises);
            } else {
                const promises = items.map(item =>
                    unstarByResource(item.type, item.id)
                );
                await Promise.all(promises);
            }
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['starred'] });
            queryClient.invalidateQueries({ queryKey: ['files'] });
            queryClient.invalidateQueries({ queryKey: ['folders'] });
            onSuccess?.(variables.star ? 'star' : 'unstar', variables.items.length);
        },
        onError: (error: Error) => {
            onError?.(error, 'star');
        },
    });

    return {
        selectedItems: state.selectedItems,
        isAllSelected: state.isAllSelected,
        selectedCount: state.selectedItems.length,
        hasSelection: state.selectedItems.length > 0,
        selectItem,
        deselectItem,
        toggleItem,
        selectAll,
        deselectAll,
        isSelected,
        bulkDelete: () => deleteMutation.mutateAsync(state.selectedItems),
        bulkMove: (targetFolderId: string) => moveMutation.mutateAsync({ items: state.selectedItems, targetFolderId }),
        bulkDownload,
        bulkStar: () => starMutation.mutateAsync({ items: state.selectedItems, star: true }),
        bulkUnstar: () => starMutation.mutateAsync({ items: state.selectedItems, star: false }),
        isDeleting: deleteMutation.isPending,
        isMoving: moveMutation.isPending,
        isDownloading,
        isStarring: starMutation.isPending,
    };
}

export default useBulkOperations;
