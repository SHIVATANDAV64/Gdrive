

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder as FolderIcon } from 'lucide-react';
import { FileCard } from './FileCard';
import { FolderCard } from './FolderCard';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Toolbar } from '@/components/layout/Toolbar';
import { cn, sortBy } from '@/lib/utils';
import type { Folder, FileDocument, BreadcrumbItem, SortField, SortDirection, ViewMode } from '@/types';
import { useViewMode } from '@/context/ViewModeContext';
import { useDragDrop } from '@/hooks/useDragDrop';
import { useBulkOperations } from '@/hooks/useBulkOperations';





interface FileExplorerProps {
    currentFolderId: string | null;
    folders: Folder[];
    files: FileDocument[];
    path: BreadcrumbItem[];
    isLoading?: boolean;
    onNewFolder?: () => void;
    onUpload?: () => void;
    onRenameFolder?: (folder: Folder) => void;
    onDeleteFolder?: (folder: Folder) => void;
    onMoveFolder?: (folder: Folder) => void;
    onShareFolder?: (folder: Folder) => void;
    onStarFolder?: (folder: Folder) => void;
    onRenameFile?: (file: FileDocument) => void;
    onDeleteFile?: (file: FileDocument) => void;
    onMoveFile?: (file: FileDocument) => void;
    onDownloadFile?: (file: FileDocument) => void;
    onShareFile?: (file: FileDocument) => void;
    onStarFile?: (file: FileDocument) => void;
    onPreviewFile?: (file: FileDocument) => void;
    onBulkShare?: (items: { id: string; type: 'file' | 'folder'; name: string }[]) => void;
    isBulkSharing?: boolean;
}





function LoadingSkeleton({ viewMode }: { viewMode: ViewMode }) {
    if (viewMode === 'list') {
        return (
            <div className="space-y-1">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3">
                        <div className="w-4 h-4 skeleton rounded" />
                        <div className="w-8 h-8 skeleton rounded-lg" />
                        <div className="flex-1 h-4 skeleton rounded" />
                        <div className="w-24 h-4 skeleton rounded" />
                        <div className="w-24 h-4 skeleton rounded" />
                        <div className="w-32 h-4 skeleton rounded" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                    <div className="w-10 h-10 skeleton rounded-lg" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 skeleton rounded" />
                        <div className="h-3 w-1/2 skeleton rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}





function EmptyState({ isRoot }: { isRoot: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <FolderIcon className="h-16 w-16 text-[var(--color-text-muted)] mb-4" />
            <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">
                {isRoot ? 'Welcome to your Drive' : 'This folder is empty'}
            </h3>
            <p className="text-[var(--color-text-secondary)] max-w-md">
                {isRoot
                    ? 'Get started by uploading files or creating a folder.'
                    : 'Upload files or create a subfolder to get started.'}
            </p>
        </div>
    );
}





// Helper functions for grid virtualization removed as we switched to standard grid layout





export function FileExplorer({
    currentFolderId,
    folders,
    files,
    path,
    isLoading = false,
    onNewFolder,
    onUpload,
    onRenameFolder,
    onDeleteFolder,
    onMoveFolder,
    onShareFolder,
    onStarFolder,
    onRenameFile,
    onDeleteFile,
    onMoveFile,
    onDownloadFile,
    onShareFile,
    onStarFile,
    onPreviewFile,
    onBulkShare,
    isBulkSharing = false,
}: FileExplorerProps) {
    const navigate = useNavigate();
    const { viewMode, setViewMode } = useViewMode();
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // --- Hooks ---
    const {
        selectedItems,
        isSelected,
        toggleItem,
        selectItem,
        selectAll,
        deselectAll,
        bulkDelete,
        bulkDownload,
        bulkStar,
        bulkMove,
        isDeleting,
        isDownloading,
        isStarring,
    } = useBulkOperations();

    const { handleDragStart, handleDrop, isMoving } = useDragDrop({
        onMoveSuccess: (item, targetId) => {
            console.log(`Moved ${item.name} to ${targetId}`);
        },
        onMoveError: (err) => {
            console.error('Move failed:', err);
        }
    });

    const selectedCount = selectedItems.length;

    // --- Sorting ---
    const sortedFolders = useMemo(() => {
        if (sortField === 'size') return folders;
        return sortBy(
            folders,
            (f) => sortField === 'name' ? f.name.toLowerCase() : f.$updatedAt,
            sortDirection
        );
    }, [folders, sortField, sortDirection]);

    const sortedFiles = useMemo(() => {
        return sortBy(
            files,
            (f) => {
                switch (sortField) {
                    case 'name': return f.name.toLowerCase();
                    case 'size': return f.sizeBytes;
                    case 'updatedAt': return f.$updatedAt;
                    default: return f.name;
                }
            },
            sortDirection
        );
    }, [files, sortField, sortDirection]);

    const handleSort = useCallback((field: SortField, direction: SortDirection) => {
        setSortField(field);
        setSortDirection(direction);
    }, []);

    const handleFolderClick = useCallback((folder: Folder) => {
        navigate(`/folder/${folder.$id}`);
    }, [navigate]);

    // --- Selection Helpers ---
    const handleSelectionChange = useCallback((item: { id: string; type: 'file' | 'folder'; name: string }, selected: boolean) => {
        if (selected) {
            selectItem(item);
        } else {
            toggleItem(item);
        }
    }, [selectItem, toggleItem]);

    const isEmpty = !isLoading && folders.length === 0 && files.length === 0;

    return (
        <div className="flex flex-col h-full bg-[var(--color-background)]">
            {/* Breadcrumb - Optional, maybe move out? Keeping for now logic */}
            {path.length > 0 && (
                <div className="px-4 py-3 border-b border-[var(--color-border)]">
                    <Breadcrumb items={path} />
                </div>
            )}

            {/* Toolbar */}
            <Toolbar
                selectedCount={selectedCount}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={handleSort}
                onNewFolder={onNewFolder}
                onUpload={onUpload}
                onDelete={bulkDelete}
                onDownload={bulkDownload}
                onStar={bulkStar}
                onShare={() => onBulkShare?.(selectedItems)}
                isDeleting={isDeleting}
                isDownloading={isDownloading}
                isSharing={isBulkSharing}
            />

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 sm:p-6" onClick={deselectAll}>
                {isLoading && <LoadingSkeleton viewMode={viewMode} />}

                {isEmpty && <EmptyState isRoot={currentFolderId === null} />}

                {!isLoading && !isEmpty && (
                    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
                        {/* Folders */}
                        {sortedFolders.length > 0 && (
                            <section>
                                {files.length > 0 && (
                                    <h2 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                                        Folders
                                    </h2>
                                )}
                                <div className={cn(
                                    viewMode === 'grid'
                                        ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4'
                                        : 'space-y-1'
                                )}>
                                    {sortedFolders.map((folder) => (
                                        <FolderCard
                                            key={folder.$id}
                                            folder={folder}
                                            viewMode={viewMode}
                                            isSelected={isSelected(folder.$id)}
                                            onSelect={(s) => handleSelectionChange({ id: folder.$id, type: 'folder', name: folder.name }, s)}
                                            onClick={() => handleFolderClick(folder)}
                                            onDoubleClick={() => handleFolderClick(folder)}
                                            onRename={() => onRenameFolder?.(folder)}
                                            onDelete={() => onDeleteFolder?.(folder)}
                                            onMove={() => onMoveFolder?.(folder)}
                                            onShare={() => onShareFolder?.(folder)}
                                            onStar={() => onStarFolder?.(folder)}
                                            onDrop={handleDrop}
                                            onDragStart={(item) => handleDragStart(item, 'folder')}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Files */}
                        {sortedFiles.length > 0 && (
                            <section>
                                {folders.length > 0 && (
                                    <h2 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                                        Files
                                    </h2>
                                )}
                                <div className={cn(
                                    viewMode === 'grid'
                                        ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4'
                                        : 'space-y-1'
                                )}>
                                    {sortedFiles.map(file => (
                                        <FileCard
                                            key={file.$id}
                                            file={file}
                                            viewMode={viewMode}
                                            isSelected={isSelected(file.$id)}
                                            onClick={() => handleSelectionChange({ id: file.$id, type: 'file', name: file.name }, !isSelected(file.$id))}
                                            onDoubleClick={() => onPreviewFile?.(file)}
                                            onSelect={(selected) => handleSelectionChange({ id: file.$id, type: 'file', name: file.name }, selected)}
                                            onRename={() => onRenameFile?.(file)}
                                            onDelete={() => onDeleteFile?.(file)}
                                            onMove={() => onMoveFile?.(file)}
                                            onDownload={() => onDownloadFile?.(file)}
                                            onShare={() => onShareFile?.(file)}
                                            onStar={() => onStarFile?.(file)}
                                            onDragStart={(item) => handleDragStart(item, 'file')}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default FileExplorer;
