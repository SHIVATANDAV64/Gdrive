/**
 * FileThumbnail Component
 * Displays thumbnails for files with fallback icons
 */

import { useState, useEffect, memo } from 'react';
import { FileIcon, Image, Video, Music, FileText, Archive, Code, Table, Presentation } from 'lucide-react';
import {
    supportsThumbnail,
    getThumbnailUrl,
    getFileCategory,
    type ThumbnailSize,
} from '@/services/thumbnail.service';
import { cn } from '@/lib/utils';

interface FileThumbnailProps {
    storageKey: string;
    mimeType: string;
    fileName: string;
    size?: ThumbnailSize;
    className?: string;
    showFallbackIcon?: boolean;
}

// Icon mapping for different file categories
const CATEGORY_ICONS: Record<string, typeof FileIcon> = {
    image: Image,
    video: Video,
    audio: Music,
    pdf: FileText,
    document: FileText,
    spreadsheet: Table,
    presentation: Presentation,
    archive: Archive,
    code: Code,
    other: FileIcon,
};

// Background colors for different categories
const CATEGORY_COLORS: Record<string, string> = {
    image: 'bg-purple-500/10 text-purple-500',
    video: 'bg-red-500/10 text-red-500',
    audio: 'bg-green-500/10 text-green-500',
    pdf: 'bg-orange-500/10 text-orange-500',
    document: 'bg-blue-500/10 text-blue-500',
    spreadsheet: 'bg-emerald-500/10 text-emerald-500',
    presentation: 'bg-amber-500/10 text-amber-500',
    archive: 'bg-slate-500/10 text-slate-500',
    code: 'bg-cyan-500/10 text-cyan-500',
    other: 'bg-gray-500/10 text-gray-500',
};

const SIZE_CLASSES: Record<ThumbnailSize, string> = {
    small: 'w-10 h-10',
    medium: 'w-16 h-16',
    large: 'w-24 h-24',
};

const ICON_SIZES: Record<ThumbnailSize, string> = {
    small: 'h-5 w-5',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
};

function FileThumbnailComponent({
    storageKey,
    mimeType,
    fileName,
    size = 'medium',
    className,
    showFallbackIcon = true,
}: FileThumbnailProps) {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const canShowThumbnail = supportsThumbnail(mimeType) && !imageError;
    const category = getFileCategory(mimeType);
    const Icon = CATEGORY_ICONS[category] || FileIcon;
    const colorClass = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;

    // Reset error state when storageKey changes
    useEffect(() => {
        setImageError(false);
        setImageLoaded(false);
    }, [storageKey]);

    if (canShowThumbnail) {
        const thumbnailUrl = getThumbnailUrl(storageKey, size);

        return (
            <div
                className={cn(
                    SIZE_CLASSES[size],
                    'relative rounded-lg overflow-hidden bg-[var(--color-surface-elevated)]',
                    className
                )}
            >
                {/* Loading placeholder */}
                {!imageLoaded && (
                    <div className={cn(
                        'absolute inset-0 flex items-center justify-center',
                        colorClass
                    )}>
                        <Icon className={cn(ICON_SIZES[size], 'animate-pulse')} />
                    </div>
                )}

                {/* Actual thumbnail */}
                <img
                    src={thumbnailUrl}
                    alt={fileName}
                    className={cn(
                        'w-full h-full object-cover transition-opacity duration-200',
                        imageLoaded ? 'opacity-100' : 'opacity-0'
                    )}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    loading="lazy"
                />
            </div>
        );
    }

    // Fallback icon for non-image files
    if (!showFallbackIcon) {
        return null;
    }

    return (
        <div
            className={cn(
                SIZE_CLASSES[size],
                'flex items-center justify-center rounded-lg',
                colorClass,
                className
            )}
        >
            <Icon className={ICON_SIZES[size]} />
        </div>
    );
}

// Memoize to prevent unnecessary re-renders
export const FileThumbnail = memo(FileThumbnailComponent);

/**
 * Grid thumbnail for file explorer
 */
export function FileGridThumbnail({
    storageKey,
    mimeType,
    fileName,
    className,
}: {
    storageKey: string;
    mimeType: string;
    fileName: string;
    className?: string;
}) {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const canShowThumbnail = supportsThumbnail(mimeType) && !imageError;
    const category = getFileCategory(mimeType);
    const Icon = CATEGORY_ICONS[category] || FileIcon;
    const colorClass = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;

    useEffect(() => {
        setImageError(false);
        setImageLoaded(false);
    }, [storageKey]);

    if (canShowThumbnail) {
        const thumbnailUrl = getThumbnailUrl(storageKey, 'large');

        return (
            <div
                className={cn(
                    'aspect-square w-full rounded-xl overflow-hidden bg-[var(--color-surface-elevated)]',
                    className
                )}
            >
                {!imageLoaded && (
                    <div className={cn(
                        'w-full h-full flex items-center justify-center',
                        colorClass
                    )}>
                        <Icon className="h-12 w-12 animate-pulse" />
                    </div>
                )}

                <img
                    src={thumbnailUrl}
                    alt={fileName}
                    className={cn(
                        'w-full h-full object-cover transition-opacity duration-200',
                        imageLoaded ? 'opacity-100' : 'opacity-0'
                    )}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    loading="lazy"
                />
            </div>
        );
    }

    return (
        <div
            className={cn(
                'aspect-square w-full rounded-xl flex items-center justify-center',
                colorClass,
                className
            )}
        >
            <Icon className="h-12 w-12" />
        </div>
    );
}

export default FileThumbnail;
