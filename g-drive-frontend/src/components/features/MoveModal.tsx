import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    Folder, 
    FolderOpen, 
    ChevronRight, 
    Home,
    Loader2,
    FolderPlus,
    ArrowLeft
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { listAllFolders, createFolder } from '@/services/folder.service';
import { useAuth } from '@/hooks/useAuth';
import type { Folder as FolderType } from '@/types';

interface MoveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMove: (targetFolderId: string | null) => Promise<void>;
    itemName: string;
    itemType: 'file' | 'folder';
    currentFolderId: string | null;
    /** Folder ID to exclude from selection (e.g., the folder being moved) */
    excludeFolderId?: string;
}

export function MoveModal({
    isOpen,
    onClose,
    onMove,
    itemName,
    itemType,
    currentFolderId,
    excludeFolderId,
}: MoveModalProps) {
    const { user } = useAuth();
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [isMoving, setIsMoving] = useState(false);
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [navigationStack, setNavigationStack] = useState<{ id: string | null; name: string }[]>([
        { id: null, name: 'My Drive' }
    ]);

    // Fetch all folders
    const { data: folders = [], isLoading, refetch } = useQuery({
        queryKey: ['all-folders', user?.$id],
        queryFn: () => listAllFolders(user?.$id ?? ''),
        enabled: isOpen && !!user?.$id,
    });

    // Get current folder from navigation stack
    const currentNavigationFolder = navigationStack[navigationStack.length - 1];

    // Filter folders to show only children of current navigation folder
    const visibleFolders = useMemo(() => {
        return folders.filter(folder => {
            // Don't show the folder being moved or its descendants
            if (excludeFolderId) {
                if (folder.$id === excludeFolderId) return false;
                // Check if folder is a descendant of the excluded folder
                let current: FolderType | undefined = folder;
                while (current?.parentId) {
                    if (current.parentId === excludeFolderId) return false;
                    current = folders.find(f => f.$id === current?.parentId);
                }
            }
            // Show only direct children of current navigation folder
            return folder.parentId === currentNavigationFolder.id;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [folders, currentNavigationFolder.id, excludeFolderId]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedFolderId(null);
            setNavigationStack([{ id: null, name: 'My Drive' }]);
            setShowNewFolder(false);
            setNewFolderName('');
        }
    }, [isOpen]);

    const handleFolderClick = (folder: FolderType) => {
        setSelectedFolderId(folder.$id);
    };

    const handleFolderDoubleClick = (folder: FolderType) => {
        // Navigate into the folder
        setNavigationStack(prev => [...prev, { id: folder.$id, name: folder.name }]);
        setSelectedFolderId(null);
    };

    const handleNavigateBack = () => {
        if (navigationStack.length > 1) {
            setNavigationStack(prev => prev.slice(0, -1));
            setSelectedFolderId(null);
        }
    };

    const handleNavigateTo = (index: number) => {
        setNavigationStack(prev => prev.slice(0, index + 1));
        setSelectedFolderId(null);
    };

    const handleMove = async () => {
        setIsMoving(true);
        try {
            // If a folder is selected, move to that folder
            // Otherwise, move to the current navigation folder
            const targetId = selectedFolderId ?? currentNavigationFolder.id;
            await onMove(targetId);
            onClose();
        } catch (error) {
            console.error('Failed to move:', error);
        } finally {
            setIsMoving(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        setIsCreatingFolder(true);
        try {
            const newFolder = await createFolder({
                name: newFolderName.trim(),
                parentId: currentNavigationFolder.id,
            });
            await refetch();
            setNewFolderName('');
            setShowNewFolder(false);
            // Select the newly created folder
            setSelectedFolderId(newFolder.$id);
        } catch (error) {
            console.error('Failed to create folder:', error);
        } finally {
            setIsCreatingFolder(false);
        }
    };

    // Determine the destination name for display
    const getDestinationName = () => {
        if (selectedFolderId) {
            const folder = folders.find(f => f.$id === selectedFolderId);
            return folder?.name ?? 'Unknown';
        }
        return currentNavigationFolder.name;
    };

    // Check if we can move to current location
    const canMoveHere = () => {
        const targetId = selectedFolderId ?? currentNavigationFolder.id;
        // Can't move to same location
        if (targetId === currentFolderId) return false;
        // For folders, can't move to itself
        if (itemType === 'folder' && targetId === excludeFolderId) return false;
        return true;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Move "${itemName}"`}
            size="md"
        >
            <div className="flex flex-col h-[400px]">
                {/* Breadcrumb navigation */}
                <div className="flex items-center gap-1 px-1 py-2 border-b border-[var(--color-border)] text-sm overflow-x-auto">
                    {navigationStack.map((item, index) => (
                        <div key={item.id ?? 'root'} className="flex items-center">
                            {index > 0 && <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)] flex-shrink-0" />}
                            <button
                                onClick={() => handleNavigateTo(index)}
                                className={cn(
                                    "px-2 py-1 rounded hover:bg-[var(--color-surface-hover)] transition-colors whitespace-nowrap",
                                    index === navigationStack.length - 1 
                                        ? "font-medium text-[var(--color-text)]" 
                                        : "text-[var(--color-text-secondary)]"
                                )}
                            >
                                {index === 0 ? (
                                    <span className="flex items-center gap-1">
                                        <Home className="h-4 w-4" />
                                        <span className="hidden sm:inline">{item.name}</span>
                                    </span>
                                ) : (
                                    item.name
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2 px-2 py-2 border-b border-[var(--color-border)]">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleNavigateBack}
                        disabled={navigationStack.length <= 1}
                        leftIcon={<ArrowLeft className="h-4 w-4" />}
                    >
                        Back
                    </Button>
                    <div className="flex-1" />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNewFolder(!showNewFolder)}
                        leftIcon={<FolderPlus className="h-4 w-4" />}
                    >
                        New folder
                    </Button>
                </div>

                {/* New folder input */}
                {showNewFolder && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-surface-hover)] border-b border-[var(--color-border)]">
                        <Folder className="h-5 w-5 text-[var(--color-primary)]" />
                        <Input
                            placeholder="New folder name"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                            autoFocus
                            className="flex-1"
                        />
                        <Button
                            size="sm"
                            onClick={handleCreateFolder}
                            disabled={!newFolderName.trim() || isCreatingFolder}
                            isLoading={isCreatingFolder}
                        >
                            Create
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setShowNewFolder(false);
                                setNewFolderName('');
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                )}

                {/* Folder list */}
                <div className="flex-1 overflow-y-auto p-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
                        </div>
                    ) : visibleFolders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)]">
                            <Folder className="h-12 w-12 mb-2 opacity-50" />
                            <p className="text-sm">No folders here</p>
                            <p className="text-xs mt-1">Create a new folder or select this location</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {visibleFolders.map((folder) => {
                                const hasChildren = folders.some(f => f.parentId === folder.$id && f.$id !== excludeFolderId);
                                const isSelected = selectedFolderId === folder.$id;

                                return (
                                    <div
                                        key={folder.$id}
                                        onClick={() => handleFolderClick(folder)}
                                        onDoubleClick={() => handleFolderDoubleClick(folder)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                                            isSelected
                                                ? "bg-[var(--color-primary)]/10 border border-[var(--color-primary)]"
                                                : "hover:bg-[var(--color-surface-hover)] border border-transparent"
                                        )}
                                    >
                                        <FolderOpen className={cn(
                                            "h-5 w-5 flex-shrink-0",
                                            isSelected ? "text-[var(--color-primary)]" : "text-[var(--color-primary)]"
                                        )} />
                                        <span className={cn(
                                            "flex-1 truncate text-sm",
                                            isSelected ? "font-medium text-[var(--color-text)]" : "text-[var(--color-text)]"
                                        )}>
                                            {folder.name}
                                        </span>
                                        {hasChildren && (
                                            <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 px-3 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
                    <div className="text-sm text-[var(--color-text-secondary)] truncate">
                        Move to: <span className="font-medium text-[var(--color-text)]">{getDestinationName()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleMove}
                            disabled={!canMoveHere() || isMoving}
                            isLoading={isMoving}
                        >
                            Move here
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

export default MoveModal;
