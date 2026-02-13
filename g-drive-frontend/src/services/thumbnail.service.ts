/**
 * Thumbnail Service
 * Generates and manages thumbnails for files using Appwrite's image transformation
 */

import { storage, AppwriteConfig } from '@/lib/appwrite';
import { ImageGravity, ImageFormat } from 'appwrite';

// Thumbnail sizes
export const THUMBNAIL_SIZES = {
    small: { width: 100, height: 100 },
    medium: { width: 200, height: 200 },
    large: { width: 400, height: 400 },
} as const;

export type ThumbnailSize = keyof typeof THUMBNAIL_SIZES;

// File types that support thumbnails
const THUMBNAIL_SUPPORTED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
];

// File types that get generic icons
const FILE_TYPE_ICONS: Record<string, string> = {
    'application/pdf': '📄',
    'application/msword': '📝',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
    'application/vnd.ms-excel': '📊',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
    'application/vnd.ms-powerpoint': '📽️',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📽️',
    'application/zip': '📦',
    'application/x-rar-compressed': '📦',
    'application/x-7z-compressed': '📦',
    'audio/mpeg': '🎵',
    'audio/wav': '🎵',
    'audio/ogg': '🎵',
    'video/mp4': '🎬',
    'video/webm': '🎬',
    'video/ogg': '🎬',
    'text/plain': '📃',
    'text/csv': '📃',
    'text/markdown': '📃',
    'application/json': '{ }',
    'application/javascript': '📜',
    'text/html': '🌐',
    'text/css': '🎨',
};

/**
 * Check if a file type supports image thumbnails
 */
export function supportsThumbnail(mimeType: string): boolean {
    return THUMBNAIL_SUPPORTED_TYPES.includes(mimeType.toLowerCase());
}

/**
 * Get file type icon for non-image files
 */
export function getFileTypeIcon(mimeType: string): string {
    return FILE_TYPE_ICONS[mimeType] || '📁';
}

/**
 * Get category for a MIME type
 */
export function getFileCategory(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'spreadsheet';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'presentation';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive';
    if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('javascript')) return 'code';
    return 'other';
}

/**
 * Generate thumbnail URL for a file
 * Uses Appwrite's built-in image transformation
 */
const GRAVITY_MAP: Record<string, ImageGravity> = {
    'center': ImageGravity.Center,
    'top-left': ImageGravity.Topleft,
    'top': ImageGravity.Top,
    'top-right': ImageGravity.Topright,
    'left': ImageGravity.Left,
    'right': ImageGravity.Right,
    'bottom-left': ImageGravity.Bottomleft,
    'bottom': ImageGravity.Bottom,
    'bottom-right': ImageGravity.Bottomright,
};

export function getThumbnailUrl(
    storageKey: string,
    size: ThumbnailSize = 'medium',
    options: {
        gravity?: 'center' | 'top-left' | 'top' | 'top-right' | 'left' | 'right' | 'bottom-left' | 'bottom' | 'bottom-right';
        quality?: number;
        borderRadius?: number;
        background?: string;
    } = {}
): string {
    const { width, height } = THUMBNAIL_SIZES[size];
    const { gravity = 'center', quality = 80, borderRadius, background } = options;

    try {
        const url = storage.getFilePreview(
            AppwriteConfig.buckets.userFiles,
            storageKey,
            width,
            height,
            GRAVITY_MAP[gravity],
            quality,
            undefined, // borderWidth
            undefined, // borderColor
            borderRadius,
            undefined, // opacity
            undefined, // rotation
            background,
            ImageFormat.Webp // output format for better compression
        );

        return url.toString();
    } catch (error) {
        console.error('Failed to generate thumbnail URL:', error);
        return '';
    }
}

/**
 * Generate download URL for a file
 */
export function getDownloadUrl(storageKey: string): string {
    try {
        return storage.getFileDownload(
            AppwriteConfig.buckets.userFiles,
            storageKey
        ).toString();
    } catch (error) {
        console.error('Failed to generate download URL:', error);
        return '';
    }
}

/**
 * Generate view URL for a file (opens in browser)
 */
export function getViewUrl(storageKey: string): string {
    try {
        return storage.getFileView(
            AppwriteConfig.buckets.userFiles,
            storageKey
        ).toString();
    } catch (error) {
        console.error('Failed to generate view URL:', error);
        return '';
    }
}

/**
 * Preload a thumbnail image
 */
export function preloadThumbnail(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load thumbnail'));
        img.src = url;
    });
}

/**
 * Batch preload thumbnails
 */
export async function preloadThumbnails(urls: string[]): Promise<void> {
    await Promise.allSettled(urls.map(preloadThumbnail));
}
