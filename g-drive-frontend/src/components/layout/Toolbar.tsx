

import { useState } from 'react';
import {
    Upload,
    FolderPlus,
    Trash2,
    Download,
    Share2,
    Star,
    Grid,
    List,
    SortAsc
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
    DropdownMenu,
    DropdownTrigger,
    DropdownContent,
    DropdownItem,
    DropdownSeparator
} from '@/components/ui/DropdownMenu';
import type { ViewMode, SortField, SortDirection } from '@/types';





interface ToolbarProps {

    selectedCount?: number;

    viewMode: ViewMode;

    onViewModeChange: (mode: ViewMode) => void;

    sortField?: SortField;

    sortDirection?: SortDirection;

    onSortChange?: (field: SortField, direction: SortDirection) => void;

    onNewFolder?: () => void;

    onUpload?: () => void;

    onDelete?: () => void;

    onDownload?: () => void;

    onShare?: () => void;

    onStar?: () => void;

    isDownloading?: boolean;
    isSharing?: boolean;
    isDeleting?: boolean;
}





export function Toolbar({
    selectedCount = 0,
    viewMode,
    onViewModeChange,
    sortField: _sortField = 'name',
    sortDirection: _sortDirection = 'asc',
    onSortChange,
    onNewFolder,
    onUpload,
    onDelete,
    onDownload,
    onShare,
    onStar,
    isDownloading = false,
    isSharing = false,
    isDeleting = false,
}: ToolbarProps) {
    const hasSelection = selectedCount > 0;

    return (
        <div className="flex items-center justify-between gap-2 h-auto sm:h-12 px-4 py-2 sm:py-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex-wrap sm:flex-nowrap">
            { }
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
                {!hasSelection ? (
                    <>
                        { }
                        <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<FolderPlus className="h-4 w-4" />}
                            onClick={onNewFolder}
                            className="hidden sm:inline-flex"
                        >
                            New folder
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onNewFolder}
                            className="sm:hidden"
                            aria-label="New folder"
                        >
                            <FolderPlus className="h-4 w-4" />
                        </Button>

                        { }
                        <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Upload className="h-4 w-4" />}
                            onClick={onUpload}
                            className="hidden sm:inline-flex"
                        >
                            Upload
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onUpload}
                            className="sm:hidden"
                            aria-label="Upload"
                        >
                            <Upload className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <>
                        { }
                        <span className="text-xs sm:text-sm text-[var(--color-text-secondary)] mr-1 sm:mr-2">
                            {selectedCount} selected
                        </span>

                        <Button
                            variant="ghost"
                            size="icon"
                            leftIcon={<Download className="h-4 w-4" />}
                            onClick={onDownload}
                            isLoading={isDownloading}
                            disabled={isDownloading}
                            className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
                            aria-label="Download"
                        />

                        <Button
                            variant="ghost"
                            size="icon"
                            leftIcon={<Share2 className="h-4 w-4" />}
                            onClick={onShare}
                            isLoading={isSharing}
                            disabled={isSharing}
                            className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
                            aria-label="Share"
                        />

                        <Button
                            variant="ghost"
                            size="icon"
                            leftIcon={<Star className="h-4 w-4" />}
                            onClick={onStar}
                            className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
                            aria-label="Star"
                        />

                        <Button
                            variant="ghost"
                            size="icon"
                            leftIcon={<Trash2 className="h-4 w-4" />}
                            onClick={onDelete}
                            isLoading={isDeleting}
                            disabled={isDeleting}
                            className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 text-[var(--color-danger)]"
                            aria-label="Delete"
                        />
                    </>
                )}
            </div>

            { }
            <div className="flex items-center gap-1 sm:gap-2 ml-auto sm:ml-0">
                { }
                <DropdownMenu>
                    <DropdownTrigger className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] rounded transition-colors">
                        <SortAsc className="h-4 w-4" />
                        Sort
                    </DropdownTrigger>
                    <DropdownContent align="right">
                        <DropdownItem onClick={() => onSortChange?.('name', 'asc')}>
                            Name (A-Z)
                        </DropdownItem>
                        <DropdownItem onClick={() => onSortChange?.('name', 'desc')}>
                            Name (Z-A)
                        </DropdownItem>
                        <DropdownSeparator />
                        <DropdownItem onClick={() => onSortChange?.('updatedAt', 'desc')}>
                            Last modified (newest)
                        </DropdownItem>
                        <DropdownItem onClick={() => onSortChange?.('updatedAt', 'asc')}>
                            Last modified (oldest)
                        </DropdownItem>
                        <DropdownSeparator />
                        <DropdownItem onClick={() => onSortChange?.('size', 'desc')}>
                            Size (largest)
                        </DropdownItem>
                        <DropdownItem onClick={() => onSortChange?.('size', 'asc')}>
                            Size (smallest)
                        </DropdownItem>
                    </DropdownContent>
                </DropdownMenu>

                { }
                <div className="flex items-center bg-[var(--color-surface-elevated)] rounded-lg p-0.5 gap-0.5">
                    <button
                        className={`p-1.5 rounded text-sm transition-colors ${viewMode === 'grid'
                            ? 'bg-[var(--color-primary)] text-white'
                            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                            }`}
                        onClick={() => onViewModeChange('grid')}
                        aria-label="Grid view"
                        title="Grid view"
                    >
                        <Grid className="h-4 w-4" />
                    </button>
                    <button
                        className={`p-1.5 rounded text-sm transition-colors ${viewMode === 'list'
                            ? 'bg-[var(--color-primary)] text-white'
                            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                            }`}
                        onClick={() => onViewModeChange('list')}
                        aria-label="List view"
                        title="List view"
                    >
                        <List className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Toolbar;
