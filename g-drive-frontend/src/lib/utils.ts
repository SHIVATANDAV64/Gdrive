 





import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

 
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}

 
export function getValidationErrorMessage(schema: any, data: unknown): string | null {
    const result = schema.safeParse(data);
    if (result.success) return null;

    
    const errors = result.error.errors
        .map((err: any) => {
            const field = err.path.join('.');
            const message = err.message;
            return field ? `${field}: ${message}` : message;
        })
        .join('; ');

    return errors || 'Invalid input';
}

 
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

 
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}





 
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

 
export function getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() ?? '' : '';
}

 
export function getBaseName(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot === -1 ? filename : filename.slice(0, lastDot);
}

 
export function isImageMimeType(mimeType: string): boolean {
    return mimeType.startsWith('image/');
}

 
export function isVideoMimeType(mimeType: string): boolean {
    return mimeType.startsWith('video/');
}

 
export function isAudioMimeType(mimeType: string): boolean {
    return mimeType.startsWith('audio/');
}

 
export function getFileTypeLabel(mimeType: string): string {
    const typeMap: Record<string, string> = {
        'application/pdf': 'PDF',
        'application/msword': 'Word',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
        'application/vnd.ms-excel': 'Excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
        'application/vnd.ms-powerpoint': 'PowerPoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
        'application/zip': 'ZIP',
        'application/json': 'JSON',
        'text/plain': 'Text',
        'text/csv': 'CSV',
        'text/markdown': 'Markdown',
    };

    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType.startsWith('audio/')) return 'Audio';

    return typeMap[mimeType] ?? 'File';
}

 
export function sanitizeFilename(filename: string): string {
    
    return filename
         
        .replace(/[/\\:*?"<>|\x00]/g, '_')
        .replace(/\.{2,}/g, '.') 
        .trim();
}





 
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

 
export function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).format(date);
}

 
export function getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return formatDate(dateString);
}

 
export function getExpiryDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
}

 
export function isExpired(dateString: string | null): boolean {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
}





 
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

 
export function isValidPassword(password: string): boolean {
    if (password.length < 8) return false;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasLetter && hasNumber;
}

 
export function calculatePasswordStrength(password: string): number {
    let score = 0;
    if (!password) return 0;

    if (password.length > 8) score += 1;
    if (password.length > 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    return Math.min(score, 4);
}

 
export function getPasswordStrengthLabel(score: number): string {
    const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return labels[score] || 'Weak';
}

 
export function getPasswordStrengthColor(score: number): string {
    const colors = [
        'var(--color-danger)',
        'var(--color-danger)',
        'var(--color-warning)',
        'var(--color-success)',
        'var(--color-success)',
    ];
    return colors[score] || 'var(--color-danger)';
}





 
export function groupBy<T, K extends string | number | symbol>(
    array: T[],
    keyFn: (item: T) => K
): Record<K, T[]> {
    return array.reduce((acc, item) => {
        const key = keyFn(item);
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {} as Record<K, T[]>);
}

 
export function sortBy<T>(
    array: T[],
    keyFn: (item: T) => string | number | Date,
    direction: 'asc' | 'desc' = 'asc'
): T[] {
    return [...array].sort((a, b) => {
        const aVal = keyFn(a);
        const bVal = keyFn(b);

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}





 

export function debounce<T extends (...args: any[]) => any>(
    fn: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), wait);
    };
}

 

export function throttle<T extends (...args: any[]) => any>(
    fn: T,
    wait: number
): (...args: Parameters<T>) => void {
    let lastCall = 0;

    return (...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastCall >= wait) {
            lastCall = now;
            fn(...args);
        }
    };
}





 
export function generateTempId(): string {
    return Math.random().toString(36).substring(2, 15);
}

 
export function safeParseJSON<T = unknown>(json: string | undefined | null, fallback: T | null = null): T | null {
    if (!json) return fallback;
    try {
        return JSON.parse(json) as T;
    } catch {
        return fallback;
    }
}
