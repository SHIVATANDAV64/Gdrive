
import {
    useState,
    useCallback,
    type DragEvent
} from 'react';
import { motion } from 'framer-motion';
import {
    Folder,
    MoreVertical,
    Trash2,
    Share2,
    Star,
    Pencil,
    FolderInput
} from 'lucide-react';
import { cn, getRelativeTime } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownTrigger,
    DropdownContent,
    DropdownItem,
    DropdownSeparator
} from '@/components/ui/DropdownMenu';
import type { Folder as FolderType } from '@/types';


interface DragData {
    type: 'file' | 'folder';
    id: string;
    name: string;
}

interface FolderCardProps {
    folder: FolderType;
    isSelected?: boolean;
    viewMode?: 'grid' | 'list';
    onClick?: () => void;
    onDoubleClick?: () => void;
    onSelect?: (selected: boolean) => void;
    onRename?: () => void;
    onDelete?: () => void;
    onMove?: () => void;
    onShare?: () => void;
    onStar?: () => void;
    onDrop?: (data: DragData, targetFolderId: string) => void;
    onDragStart?: (folder: FolderType) => void;
    isDragging?: boolean;
}


export function FolderCard({
    folder,
    isSelected = false,
    viewMode = 'grid',
    onClick,
    onDoubleClick,
    onSelect,
    onRename,
    onDelete,
    onMove,
    onShare,
    onStar,
    onDrop,
    onDragStart,
    isDragging = false,
}: FolderCardProps) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'folder',
            id: folder.$id,
            name: folder.name
        }));
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(folder);
    }, [folder, onDragStart]);

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const types = e.dataTransfer.types;
            if (types.includes('application/json')) {
                e.dataTransfer.dropEffect = 'move';
                setIsDragOver(true);
            }
        } catch {

        }
    }, []);

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDropOnFolder = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json')) as DragData;
            if (data.type === 'folder' && data.id === folder.$id) {
                return;
            }
            onDrop?.(data, folder.$id);
        } catch {

        }
    }, [folder.$id, onDrop]);

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        onSelect?.(e.target.checked);
    };

    /* --- List View --- */
    if (viewMode === 'list') {
        return (
            <div
                draggable
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDropOnFolder}
                className={cn(
                    'group flex items-center gap-4 px-4 py-3 rounded-lg',
                    'bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]',
                    'border border-transparent hover:border-[var(--color-border-subtle)]',
                    'transition-colors duration-200 cursor-pointer',
                    isSelected && 'bg-blue-50 border-blue-200 ring-1 ring-blue-200',
                    isDragOver && 'bg-blue-100 border-blue-400 ring-2 ring-blue-200',
                    isDragging && 'opacity-50'
                )}
                onClick={onClick}
                onDoubleClick={onDoubleClick}
            >
                {/* Checkbox */}
                <div className="flex items-center justify-center w-6 h-6" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={handleCheckboxChange}
                        className={cn(
                            "w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity",
                            isSelected && "opacity-100"
                        )}
                        aria-label={`Select ${folder.name}`}
                    />
                </div>

                {/* Icon */}
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 shrink-0">
                    <Folder className="h-5 w-5 text-blue-600 fill-blue-600/20" />
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0 pr-4">
                    <p className="font-medium text-[var(--color-text)] truncate text-[15px]">{folder.name}</p>
                </div>

                {/* Meta Columns */}
                <div className="w-24 text-sm text-[var(--color-text-secondary)] hidden md:block">
                    Folder
                </div>
                <div className="w-24 text-sm text-[var(--color-text-muted)] hidden sm:block">
                    —
                </div>
                <div className="w-32 text-sm text-[var(--color-text-muted)] hidden lg:block">
                    {getRelativeTime(folder.$updatedAt)}
                </div>

                {/* Actions */}
                <DropdownMenu>
                    <DropdownTrigger className="p-2 rounded-md hover:bg-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                    </DropdownTrigger>
                    <DropdownContent align="end">
                        <DropdownItem icon={<Share2 className="h-4 w-4" />} onClick={onShare}>
                            Share
                        </DropdownItem>
                        <DropdownItem icon={<Star className="h-4 w-4" />} onClick={onStar}>
                            Star
                        </DropdownItem>
                        <DropdownSeparator />
                        <DropdownItem icon={<Pencil className="h-4 w-4" />} onClick={onRename}>
                            Rename
                        </DropdownItem>
                        <DropdownItem icon={<FolderInput className="h-4 w-4" />} onClick={onMove}>
                            Move to
                        </DropdownItem>
                        <DropdownItem icon={<Trash2 className="h-4 w-4" />} onClick={onDelete} destructive>
                            Delete
                        </DropdownItem>
                    </DropdownContent>
                </DropdownMenu>
            </div>
        );
    }

    /* --- Grid View --- */
    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDropOnFolder}
            className={cn(
                'group relative flex flex-col p-4 rounded-lg',
                'bg-[var(--color-surface)] border border-[var(--color-border)]',
                'hover:border-[var(--color-border-focus)] hover:shadow-md',
                'transition-all duration-200 cursor-pointer',
                isSelected && 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)] bg-blue-50/10',
                isDragOver && 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] bg-blue-50/20',
                isDragging && 'opacity-50'
            )}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
        >
            {/* Checkbox - Absolute Top Left */}
            <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={handleCheckboxChange}
                    aria-label={`Select ${folder.name}`}
                    className={cn(
                        'w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]',
                        'opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm bg-white',
                        isSelected && 'opacity-100'
                    )}
                />
            </div>

            {/* Header */}
            <div className="flex justify-between items-start mb-3 pt-2">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-50">
                    <Folder className="h-6 w-6 text-blue-600 fill-blue-600/20" />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--color-text)] truncate text-[15px] leading-tight mb-1" title={folder.name}>
                    {folder.name}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                    {getRelativeTime(folder.$updatedAt)}
                </p>
            </div>

            {/* Actions */}
            <div className="absolute top-2 right-2">
                <DropdownMenu>
                    <DropdownTrigger className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                    </DropdownTrigger>
                    <DropdownContent align="end">
                        <DropdownItem icon={<Share2 className="h-4 w-4" />} onClick={onShare}>
                            Share
                        </DropdownItem>
                        <DropdownItem icon={<Star className="h-4 w-4" />} onClick={onStar}>
                            Star
                        </DropdownItem>
                        <DropdownSeparator />
                        <DropdownItem icon={<Pencil className="h-4 w-4" />} onClick={onRename}>
                            Rename
                        </DropdownItem>
                        <DropdownItem icon={<FolderInput className="h-4 w-4" />} onClick={onMove}>
                            Move to
                        </DropdownItem>
                        <DropdownItem icon={<Trash2 className="h-4 w-4" />} onClick={onDelete} destructive>
                            Delete
                        </DropdownItem>
                    </DropdownContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

export default FolderCard;
