 

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Folder as FolderIcon, File as FileIcon, Loader2, StarOff, RefreshCw, AlertCircle } from 'lucide-react';
import { shareService } from '@/services/share.service';
import { Button } from '@/components/ui';
import { formatFileSize } from '@/lib/utils';
import type { FileDocument, Folder } from '@/types';

interface StarredItem {
    star: {
        $id: string;
        userId: string;
        resourceType: 'file' | 'folder';
        resourceId: string;
    };
    resource: FileDocument | Folder;
    resourceType: 'file' | 'folder';
}





function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
            <Loader2 className="h-10 w-10 text-[var(--color-primary)] animate-spin mb-4" />
            <p className="text-[var(--color-text-secondary)]">Loading starred items...</p>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
            <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mb-6">
                <Star className="h-10 w-10 text-yellow-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-text)] mb-2">
                No starred items
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm max-w-md">
                Star files and folders for quick access. Your starred items will appear here.
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
                Failed to load starred items
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





export default function StarredPage() {
    const navigate = useNavigate();
    const [starredItems, setStarredItems] = useState<StarredItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [unstarringId, setUnstarringId] = useState<string | null>(null);

    const loadStarredItems = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const items = await shareService.getStarredItems();
            setStarredItems(items);
        } catch (err) {
            console.error('Failed to load starred items:', err);
            setError(err instanceof Error ? err.message : 'Failed to load starred items');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStarredItems();
    }, [loadStarredItems]);

    const handleUnstar = async (starId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            setUnstarringId(starId);
            await shareService.unstarItem(starId);
            setStarredItems(prev => prev.filter(item => item.star.$id !== starId));
        } catch (err) {
            console.error('Failed to unstar item:', err);
            setError(err instanceof Error ? err.message : 'Failed to unstar item');
        } finally {
            setUnstarringId(null);
        }
    };

    const handleItemClick = (item: StarredItem) => {
        if (item.resourceType === 'folder') {
            navigate(`/folder/${item.star.resourceId}`);
        } else {
            
            const file = item.resource as FileDocument;
            if (file.folderId) {
                navigate(`/folder/${file.folderId}`);
            } else {
                navigate('/');
            }
        }
    };

    
    if (isLoading) {
        return <LoadingState />;
    }

    
    if (error) {
        return <ErrorState error={error} onRetry={loadStarredItems} />;
    }

    
    if (starredItems.length === 0) {
        return <EmptyState />;
    }

    
    return (
        <div className="space-y-6 page-enter">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-[var(--color-text)] flex items-center gap-2">
                    <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                    Starred
                    <span className="text-sm font-normal text-[var(--color-text-muted)]">
                        ({starredItems.length})
                    </span>
                </h1>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadStarredItems}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                >
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {starredItems.map((item, index) => (
                    <div
                        key={item.star.$id}
                        onClick={() => handleItemClick(item)}
                        className="group relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-primary)] transition-all cursor-pointer stagger-item"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        { }
                        <button
                            onClick={(e) => handleUnstar(item.star.$id, e)}
                            disabled={unstarringId === item.star.$id}
                            className="absolute top-3 right-3 p-1.5 rounded-full bg-yellow-500/10 hover:bg-red-500/20 transition-colors group/star"
                            title="Remove from starred"
                        >
                            {unstarringId === item.star.$id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-[var(--color-text-muted)]" />
                            ) : (
                                <>
                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 group-hover/star:hidden" />
                                    <StarOff className="h-4 w-4 text-red-400 hidden group-hover/star:block" />
                                </>
                            )}
                        </button>

                        { }
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2.5 rounded-xl ${item.resourceType === 'folder'
                                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                    : 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]'
                                }`}>
                                {item.resourceType === 'folder' ? (
                                    <FolderIcon className="h-6 w-6" />
                                ) : (
                                    <FileIcon className="h-6 w-6" />
                                )}
                            </div>
                        </div>

                        { }
                        <h3
                            className="font-medium text-[var(--color-text)] truncate pr-8"
                            title={item.resource.name}
                        >
                            {item.resource.name}
                        </h3>

                        { }
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">
                            {item.resourceType === 'file'
                                ? formatFileSize((item.resource as FileDocument).sizeBytes)
                                : 'Folder'}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
