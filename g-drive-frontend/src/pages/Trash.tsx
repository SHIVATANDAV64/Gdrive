 

import { useState, useEffect, useCallback } from 'react';
import { Trash2, Loader2, RefreshCw, AlertTriangle, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { functions, AppwriteConfig } from '@/lib/appwrite';
import { ExecutionMethod } from 'appwrite';
import { TRASH_RETENTION_DAYS, QUERY_KEYS } from '@/lib/constants';
import { safeParseJSON } from '@/lib/utils';
import { TrashItemCard, type TrashItem } from '@/components/features/TrashItemCard';
import { ConfirmDeleteModal } from '@/components/features/ConfirmDeleteModal';
import { Button, Modal } from '@/components/ui';

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: { code: string; message: string };
}





function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
            <Loader2 className="h-10 w-10 text-[var(--color-primary)] animate-spin mb-4" />
            <p className="text-[var(--color-text-secondary)]">Loading trash...</p>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
            <div className="w-20 h-20 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center mb-6">
                <Trash2 className="h-10 w-10 text-[var(--color-text-muted)]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-text)] mb-2">
                Trash is empty
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm max-w-md">
                Deleted files and folders will appear here. You can restore them or permanently delete them.
            </p>
        </div>
    );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-[var(--color-danger)]/10 flex items-center justify-center mb-6">
                <AlertCircle className="h-8 w-8 text-[var(--color-danger)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                Failed to load trash
            </h3>
            <p className="text-[var(--color-text-secondary)] text-sm max-w-sm mb-6">{error}</p>
            <Button
                onClick={onRetry}
                leftIcon={<RefreshCw className="h-4 w-4" />}
            >
                Try again
            </Button>
        </div>
    );
}





export default function TrashPage() {
    const queryClient = useQueryClient();
    const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actioningId, setActioningId] = useState<string | null>(null);
    const [isEmptying, setIsEmptying] = useState(false);
    const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
    const [deleteConfirmItem, setDeleteConfirmItem] = useState<TrashItem | null>(null);

    const loadTrashItems = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await functions.createExecution(
                AppwriteConfig.functions.manageTrash,
                '',
                false,
                '/',
                ExecutionMethod.GET
            );

            const result = safeParseJSON<ApiResponse<{ items: TrashItem[] }>>(response.responseBody);
            if (!result || !result.success) {
                throw new Error(result?.error?.message ?? 'Failed to load trash');
            }

            setTrashItems(result.data?.items ?? []);
        } catch (err) {
            console.error('Failed to load trash:', err);
            setError(err instanceof Error ? err.message : 'Failed to load trash');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTrashItems();
    }, [loadTrashItems]);

    const handleRestore = async (item: TrashItem, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            setActioningId(item.$id);

            const response = await functions.createExecution(
                AppwriteConfig.functions.manageTrash,
                JSON.stringify({
                    resourceType: item.resourceType,
                    resourceId: item.$id,
                }),
                false,
                '/restore',
                ExecutionMethod.POST
            );

            const result = safeParseJSON<ApiResponse>(response.responseBody);
            if (!result || !result.success) {
                throw new Error(result?.error?.message ?? 'Failed to restore item');
            }

            setTrashItems(prev => prev.filter(i => i.$id !== item.$id));
        } catch (err) {
            console.error('Failed to restore item:', err);
            setError(err instanceof Error ? err.message : 'Failed to restore item');
        } finally {
            setActioningId(null);
        }
    };

    const handlePermanentDelete = async (item: TrashItem, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteConfirmItem(item);
    };

    const confirmPermanentDelete = async () => {
        const item = deleteConfirmItem;
        if (!item) return;
        setDeleteConfirmItem(null);

        try {
            setActioningId(item.$id);

            const response = await functions.createExecution(
                AppwriteConfig.functions.manageTrash,
                '',
                false,
                `/?resourceType=${item.resourceType}&resourceId=${item.$id}`,
                ExecutionMethod.DELETE
            );

            const result = safeParseJSON<ApiResponse>(response.responseBody);
            if (!result || !result.success) {
                throw new Error(result?.error?.message ?? 'Failed to delete item');
            }

            setTrashItems(prev => prev.filter(i => i.$id !== item.$id));
            // Invalidate storage to update the usage bar
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.storage });
        } catch (err) {
            console.error('Failed to delete item:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete item');
        } finally {
            setActioningId(null);
        }
    };

    const handleEmptyTrash = async () => {
        try {
            setIsEmptying(true);
            setShowEmptyConfirm(false);

            const response = await functions.createExecution(
                AppwriteConfig.functions.manageTrash,
                '',
                false,
                '/empty',
                ExecutionMethod.POST
            );

            const result = safeParseJSON<ApiResponse>(response.responseBody);
            if (!result || !result.success) {
                throw new Error(result?.error?.message ?? 'Failed to empty trash');
            }

            setTrashItems([]);
            // Invalidate storage to update the usage bar
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.storage });
        } catch (err) {
            console.error('Failed to empty trash:', err);
            setError(err instanceof Error ? err.message : 'Failed to empty trash');
        } finally {
            setIsEmptying(false);
        }
    };

    const getDaysUntilDeletion = (updatedAt: string): number => {
        const deletedDate = new Date(updatedAt);
        const deleteByDate = new Date(deletedDate.getTime() + (TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000));
        const now = new Date();
        const daysLeft = Math.ceil((deleteByDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        return Math.max(0, daysLeft);
    };

    
    if (isLoading) {
        return <LoadingState />;
    }

    
    if (error) {
        return <ErrorState error={error} onRetry={loadTrashItems} />;
    }

    
    if (trashItems.length === 0) {
        return (
            <div className="space-y-6 page-enter">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-text)] flex items-center gap-2">
                            <Trash2 className="h-6 w-6 text-[var(--color-text-muted)]" />
                            Trash
                        </h1>
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">
                            Items are automatically deleted after {TRASH_RETENTION_DAYS} days
                        </p>
                    </div>
                </div>
                <EmptyState />
            </div>
        );
    }

    
    return (
        <div className="space-y-6 page-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)] flex items-center gap-2">
                        <Trash2 className="h-6 w-6 text-[var(--color-danger)]" />
                        Trash
                        <span className="text-sm font-normal text-[var(--color-text-muted)]">
                            ({trashItems.length})
                        </span>
                    </h1>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">
                        Items are automatically deleted after {TRASH_RETENTION_DAYS} days
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadTrashItems}
                        leftIcon={<RefreshCw className="h-4 w-4" />}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setShowEmptyConfirm(true)}
                        isLoading={isEmptying}
                        leftIcon={!isEmptying && <Trash2 className="h-4 w-4" />}
                    >
                        Empty Trash
                    </Button>
                </div>
            </div>

            { }
            <Modal
                isOpen={showEmptyConfirm}
                onClose={() => setShowEmptyConfirm(false)}
                title="Empty Trash?"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[var(--color-danger)]/10">
                            <AlertTriangle className="h-6 w-6 text-[var(--color-danger)]" />
                        </div>
                        <p className="text-[var(--color-text-secondary)] text-sm">
                            This will permanently delete all <strong>{trashItems.length}</strong> items in trash.
                            This action cannot be undone.
                        </p>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="secondary"
                            onClick={() => setShowEmptyConfirm(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleEmptyTrash}
                            isLoading={isEmptying}
                        >
                            Empty Trash
                        </Button>
                    </div>
                </div>
            </Modal>

            { }
            {deleteConfirmItem && (
                <ConfirmDeleteModal
                    isOpen={true}
                    itemName={deleteConfirmItem.name}
                    onConfirm={confirmPermanentDelete}
                    onCancel={() => setDeleteConfirmItem(null)}
                />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {trashItems.map((item, index) => {
                    const daysLeft = getDaysUntilDeletion(item.$updatedAt);
                    return (
                        <div
                            key={item.$id}
                            className="stagger-item"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <TrashItemCard
                                item={item}
                                daysLeft={daysLeft}
                                isActioning={actioningId === item.$id}
                                onRestore={(e) => handleRestore(item, e)}
                                onDelete={(e) => handlePermanentDelete(item, e)}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
