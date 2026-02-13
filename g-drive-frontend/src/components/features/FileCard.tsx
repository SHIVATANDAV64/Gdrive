
import {
    useCallback,
    type DragEvent
} from 'react';
import { motion } from 'framer-motion';
import {
    File,
    Image,
    Video,
    Music,
    FileText,
    MoreVertical,
    Download,
    Trash2,
    Share2,
    Star,
    Pencil,
    FolderInput
} from 'lucide-react';
import { cn, formatFileSize, getRelativeTime, getFileTypeLabel } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownTrigger,
    DropdownContent,
    DropdownItem,
    DropdownSeparator
} from '@/components/ui/DropdownMenu';
import type { FileDocument } from '@/types';


interface FileCardProps {
    file: FileDocument;
    isSelected?: boolean;
    viewMode?: 'grid' | 'list';
    onClick?: () => void;
    onDoubleClick?: () => void;
    onSelect?: (selected: boolean) => void;
    onRename?: () => void;
    onDelete?: () => void;
    onMove?: () => void;
    onDownload?: () => void;
    onShare?: () => void;
    onStar?: () => void;
    onDragStart?: (file: FileDocument) => void;
    isDragging?: boolean;
}


const fileIconColors: Record<string, string> = {
    image: 'text-purple-600 bg-purple-50',
    video: 'text-red-600 bg-red-50',
    audio: 'text-amber-600 bg-amber-50',
    document: 'text-blue-600 bg-blue-50',
    default: 'text-slate-600 bg-slate-100',
};

function getIconColor(mimeType: string): string {
    if (mimeType.startsWith('image/')) return fileIconColors.image;
    if (mimeType.startsWith('video/')) return fileIconColors.video;
    if (mimeType.startsWith('audio/')) return fileIconColors.audio;
    if (mimeType.includes('text') || mimeType.includes('document')) return fileIconColors.document;
    return fileIconColors.default;
}

interface FileIconProps {
    mimeType: string;
    className?: string;
}

const FileIcon = ({ mimeType, className }: FileIconProps) => {
    if (mimeType.startsWith('image/')) return <Image className={className} />;
    if (mimeType.startsWith('video/')) return <Video className={className} />;
    if (mimeType.startsWith('audio/')) return <Music className={className} />;
    if (mimeType.includes('text') || mimeType.includes('document')) return <FileText className={className} />;
    return <File className={className} />;
};


export function FileCard({
    file,
    isSelected = false,
    viewMode = 'grid',
    onClick,
    onDoubleClick,
    onSelect,
    onRename,
    onDelete,
    onMove,
    onDownload,
    onShare,
    onStar,
    onDragStart,
    isDragging = false,
}: FileCardProps) {

    const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'file',
            id: file.$id,
            name: file.name
        }));
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(file);
    }, [file, onDragStart]);

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        onSelect?.(e.target.checked);
    };

    const iconColorClass = getIconColor(file.mimeType);

    /* --- List View --- */
    if (viewMode === 'list') {
        return (
            <div
                draggable
                onDragStart={handleDragStart}
                className={cn(
                    'group flex items-center gap-4 px-4 py-3 rounded-lg',
                    'bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]',
                    'border border-transparent hover:border-[var(--color-border-subtle)]',
                    'transition-colors duration-200 cursor-pointer',
                    isSelected && 'bg-blue-50 border-blue-200 ring-1 ring-blue-200',
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
                        aria-label={`Select ${file.name}`}
                    />
                </div>

                {/* Icon */}
                <div className={cn('flex items-center justify-center w-10 h-10 rounded-lg shrink-0', iconColorClass.split(' ')[1])}>
                    <FileIcon mimeType={file.mimeType} className={cn('h-5 w-5', iconColorClass.split(' ')[0])} />
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0 pr-4">
                    <p className="font-medium text-[var(--color-text)] truncate text-[15px]">{file.name}</p>
                </div>

                {/* Meta Columns */}
                <div className="w-24 text-sm text-[var(--color-text-secondary)] hidden md:block">
                    {getFileTypeLabel(file.mimeType)}
                </div>
                <div className="w-24 text-sm text-[var(--color-text-secondary)] hidden sm:block">
                    {formatFileSize(file.sizeBytes)}
                </div>
                <div className="w-32 text-sm text-[var(--color-text-muted)] hidden lg:block">
                    {getRelativeTime(file.$updatedAt)}
                </div>

                {/* Actions */}
                <DropdownMenu>
                    <DropdownTrigger className="p-2 rounded-md hover:bg-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                    </DropdownTrigger>
                    <DropdownContent align="end">
                        <DropdownItem icon={<Download className="h-4 w-4" />} onClick={onDownload}>
                            Download
                        </DropdownItem>
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
            className={cn(
                'group relative flex flex-col p-4 rounded-lg',
                'bg-[var(--color-surface)] border border-[var(--color-border)]',
                'hover:border-[var(--color-border-focus)] hover:shadow-md',
                'transition-all duration-200 cursor-pointer',
                isSelected && 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)] bg-blue-50/10',
                isDragging && 'opacity-50'
            )}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
        >
            {/* Checkbox - Absolute Top Left */}
            {onSelect && (
                <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={handleCheckboxChange}
                        aria-label={`Select ${file.name}`}
                        className={cn(
                            'w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]',
                            'opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm bg-white',
                            isSelected && 'opacity-100'
                        )}
                    />
                </div>
            )}

            {/* Header: Icon */}
            <div className="flex justify-between items-start mb-3 pt-2">
                <div className={cn(
                    'flex items-center justify-center h-12 w-12 rounded-lg',
                    iconColorClass.split(' ')[1]
                )}>
                    <FileIcon mimeType={file.mimeType} className={cn('h-6 w-6', iconColorClass.split(' ')[0])} />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--color-text)] truncate text-[15px] leading-tight mb-1" title={file.name}>
                    {file.name}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                    {formatFileSize(file.sizeBytes)} • {getRelativeTime(file.$updatedAt)}
                </p>
            </div>

            {/* Actions (Absolute) */}
            <div className="absolute top-2 right-2">
                <DropdownMenu>
                    <DropdownTrigger className="p-1.5 rounded-md hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                        <MoreVertical className="h-4 w-4" />
                    </DropdownTrigger>
                    <DropdownContent align="end">
                        <DropdownItem icon={<Download className="h-4 w-4" />} onClick={onDownload}>
                            Download
                        </DropdownItem>
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

export default FileCard;
