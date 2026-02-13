

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { moveFiles } from '@/services/file.service';
import { updateFolder } from '@/services/folder.service';
import type { FileDocument, Folder } from '@/types';
import { QUERY_KEYS } from '@/lib/constants';





export interface DragData {
    type: 'file' | 'folder';
    id: string;
    name: string;
}

interface UseDragDropOptions {
    onMoveSuccess?: (item: DragData, targetFolderId: string) => void;
    onMoveError?: (error: Error, item: DragData) => void;
}

interface UseDragDropReturn {
    draggedItem: DragData | null;
    isDragging: boolean;
    handleDragStart: (item: FileDocument | Folder, type: 'file' | 'folder') => void;
    handleDragEnd: () => void;
    handleDrop: (data: DragData, targetFolderId: string) => void;
    isMoving: boolean;
}





export function useDragDrop(options: UseDragDropOptions = {}): UseDragDropReturn {
    const { onMoveSuccess, onMoveError } = options;
    const [draggedItem, setDraggedItem] = useState<DragData | null>(null);
    const queryClient = useQueryClient();


    const moveFileMutation = useMutation({
        mutationFn: async ({ fileId, targetFolderId }: { fileId: string; targetFolderId: string }) => {
            return moveFiles([fileId], targetFolderId);
        },
        onSuccess: (_, variables) => {

            // Invalidate folders to update file lists in all views
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.folders.all });
            // Also invalidate specific file details if open
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.files.all });

            if (draggedItem) {
                onMoveSuccess?.(draggedItem, variables.targetFolderId);
            }
        },
        onError: (error: Error) => {
            if (draggedItem) {
                onMoveError?.(error, draggedItem);
            }
        },
    });


    const moveFolderMutation = useMutation({
        mutationFn: async ({ folderId, targetFolderId }: { folderId: string; targetFolderId: string }) => {
            return updateFolder(folderId, { parentId: targetFolderId });
        },
        onSuccess: (_, variables) => {

            queryClient.invalidateQueries({ queryKey: ['folders'] });
            if (draggedItem) {
                onMoveSuccess?.(draggedItem, variables.targetFolderId);
            }
        },
        onError: (error: Error) => {
            if (draggedItem) {
                onMoveError?.(error, draggedItem);
            }
        },
    });

    const handleDragStart = useCallback((item: FileDocument | Folder, type: 'file' | 'folder') => {
        setDraggedItem({
            type,
            id: item.$id,
            name: item.name,
        });
    }, []);

    const handleDragEnd = useCallback(() => {
        setDraggedItem(null);
    }, []);

    const handleDrop = useCallback((data: DragData, targetFolderId: string) => {
        if (data.type === 'file') {
            moveFileMutation.mutate({ fileId: data.id, targetFolderId });
        } else {

            if (data.id === targetFolderId) {
                return;
            }
            moveFolderMutation.mutate({ folderId: data.id, targetFolderId });
        }
    }, [moveFileMutation, moveFolderMutation]);

    return {
        draggedItem,
        isDragging: draggedItem !== null,
        handleDragStart,
        handleDragEnd,
        handleDrop,
        isMoving: moveFileMutation.isPending || moveFolderMutation.isPending,
    };
}

export default useDragDrop;
