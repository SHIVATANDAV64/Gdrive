import { useState, useEffect, memo } from 'react';
import {
    FileIcon,
    Image,
    Video,
    Music,
    FileText,
    Archive,
    Code,
    Table,
    Presentation,
    Download,
    ExternalLink,
    AlertCircle,
    CheckCircle,
    File,
    Folder as FolderIcon,
    Clock,
    User,
    Lock,
    Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn, formatFileSize } from '@/lib/utils';
import type { FileDocument, Folder, LinkShare } from '@/types';
import { getViewUrl, getDownloadUrl, supportsThumbnail } from '@/services/thumbnail.service';

interface SharedResourceViewProps {
    resource: FileDocument | Folder;
    link: LinkShare;
    downloadUrl?: string;
    viewUrl?: string;
}

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
    folder: FolderIcon,
    other: File,
};

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
    folder: 'bg-yellow-500/10 text-yellow-500',
    other: 'bg-gray-500/10 text-gray-500',
};

function getFileCategory(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'spreadsheet';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
    if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed')) return 'archive';
    if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('xml') || mimeType.includes('javascript') || mimeType.includes('typescript') || mimeType.includes('html') || mimeType.includes('css')) return 'code';
    if (mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('opendocument')) return 'document';
    return 'other';
}

function FilePreview({ file, downloadUrl, viewUrl }: { file: FileDocument; downloadUrl?: string; viewUrl?: string }) {
    const [previewError, setPreviewError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const canPreview = supportsThumbnail(file.mimeType) && !previewError;
    const previewUrl = canPreview ? viewUrl || getViewUrl(file.storageKey) : (viewUrl || null);

    if (file.mimeType.startsWith('image/') && previewUrl) {
        return (
            <div className="relative w-full h-full min-h-[300px] max-h-[600px] flex items-center justify-center bg-[var(--color-surface-elevated)] rounded-xl overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                <img
                    src={previewUrl}
                    alt={file.name}
                    className={cn(
                        'max-w-full max-h-full object-contain transition-opacity duration-300',
                        isLoading ? 'opacity-0' : 'opacity-100'
                    )}
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                        setPreviewError(true);
                        setIsLoading(false);
                    }}
                />
            </div>
        );
    }

    if (file.mimeType.startsWith('video/') && previewUrl) {
        return (
            <div className="w-full rounded-xl overflow-hidden bg-black">
                <video
                    src={previewUrl}
                    controls
                    className="w-full max-h-[500px]"
                    onError={() => setPreviewError(true)}
                >
                    Your browser does not support the video tag.
                </video>
            </div>
        );
    }

    if (file.mimeType.startsWith('audio/') && previewUrl) {
        return (
            <div className="w-full p-8 bg-[var(--color-surface-elevated)] rounded-xl">
                <audio
                    src={previewUrl}
                    controls
                    className="w-full"
                    onError={() => setPreviewError(true)}
                >
                    Your browser does not support the audio tag.
                </audio>
            </div>
        );
    }

    if (file.mimeType === 'application/pdf' && previewUrl) {
        return (
            <div className="w-full h-[600px] rounded-xl overflow-hidden bg-[var(--color-surface-elevated)]">
                <iframe
                    src={previewUrl}
                    title={file.name}
                    className="w-full h-full border-0"
                    onError={() => setPreviewError(true)}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-12 bg-[var(--color-surface-elevated)] rounded-xl">
            <FileIconDisplay mimeType={file.mimeType} size="large" />
            <p className="mt-4 text-[var(--color-text-secondary)] text-sm text-center">
                Preview not available for this file type
            </p>
            {downloadUrl && (
                <Button
                    variant="outline"
                    className="mt-4"
                    leftIcon={<Download className="h-4 w-4" />}
                    onClick={() => window.open(downloadUrl, '_blank')}
                >
                    Download to view
                </Button>
            )}
        </div>
    );
}

function FileIconDisplay({ mimeType, size = 'medium' }: { mimeType: string; size?: 'small' | 'medium' | 'large' }) {
    const category = getFileCategory(mimeType);
    const Icon = CATEGORY_ICONS[category] || FileIcon;
    const colorClass = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;

    const sizeClasses = {
        small: 'w-10 h-10',
        medium: 'w-16 h-16',
        large: 'w-24 h-24',
    };

    const iconSizes = {
        small: 'h-5 w-5',
        medium: 'h-8 w-8',
        large: 'h-12 w-12',
    };

    return (
        <div className={cn('rounded-xl flex items-center justify-center', sizeClasses[size], colorClass)}>
            <Icon className={iconSizes[size]} />
        </div>
    );
}

function FileDetails({ file, link, downloadUrl }: { file: FileDocument; link: LinkShare; downloadUrl?: string }) {
    const [copied, setCopied] = useState(false);
    const category = getFileCategory(file.mimeType);
    const Icon = CATEGORY_ICONS[category] || FileIcon;
    const isPasswordProtected = !!link.passwordHash;
    const isExpired = link.expiresAt ? new Date(link.expiresAt) < new Date() : false;

    const handleCopyLink = () => {
        const shareUrl = `${window.location.origin}/s/${link.token}`;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (downloadUrl) {
            window.open(downloadUrl, '_blank');
        }
    };

    return (
        <div className="space-y-6">
            {/* File Header */}
            <div className="flex items-start gap-4">
                <FileIconDisplay mimeType={file.mimeType} size="large" />
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-semibold text-[var(--color-text)] truncate">
                        {file.name}
                    </h1>
                    <div className="flex items-center gap-3 mt-2 text-sm text-[var(--color-text-secondary)]">
                        <span className="flex items-center gap-1">
                            <Icon className="h-4 w-4" />
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                        </span>
                        <span>•</span>
                        <span>{formatFileSize(file.sizeBytes)}</span>
                    </div>
                </div>
            </div>

            {/* Security Badges */}
            <div className="flex flex-wrap gap-2">
                {isPasswordProtected ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium">
                        <Lock className="h-3.5 w-3.5" />
                        Password Protected
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 text-sm font-medium">
                        <Globe className="h-3.5 w-3.5" />
                        Public Access
                    </span>
                )}
                {link.expiresAt && (
                    <span className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                        isExpired
                            ? 'bg-red-500/10 text-red-600'
                            : 'bg-blue-500/10 text-blue-600'
                    )}>
                        <Clock className="h-3.5 w-3.5" />
                        {isExpired ? 'Expired' : `Expires ${new Date(link.expiresAt).toLocaleDateString()}`}
                    </span>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
                {downloadUrl && (
                    <Button
                        onClick={handleDownload}
                        leftIcon={<Download className="h-4 w-4" />}
                        className="flex-1 sm:flex-none"
                    >
                        Download
                    </Button>
                )}
                <Button
                    variant="outline"
                    onClick={handleCopyLink}
                    leftIcon={copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <ExternalLink className="h-4 w-4" />}
                    className="flex-1 sm:flex-none"
                >
                    {copied ? 'Link Copied!' : 'Copy Link'}
                </Button>
            </div>

            {/* File Info */}
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-4 space-y-3">
                <h3 className="font-medium text-[var(--color-text)]">File Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-[var(--color-text-muted)]">Type</p>
                        <p className="text-[var(--color-text)]">{file.mimeType}</p>
                    </div>
                    <div>
                        <p className="text-[var(--color-text-muted)]">Size</p>
                        <p className="text-[var(--color-text)]">{formatFileSize(file.sizeBytes)}</p>
                    </div>
                    <div>
                        <p className="text-[var(--color-text-muted)]">Created</p>
                        <p className="text-[var(--color-text)]">{new Date(file.$createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p className="text-[var(--color-text-muted)]">Modified</p>
                        <p className="text-[var(--color-text)]">{new Date(file.$updatedAt).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FolderDetails({ folder, link }: { folder: Folder; link: LinkShare }) {
    const [copied, setCopied] = useState(false);
    const isPasswordProtected = !!link.passwordHash;
    const isExpired = link.expiresAt ? new Date(link.expiresAt) < new Date() : false;

    const handleCopyLink = () => {
        const shareUrl = `${window.location.origin}/s/${link.token}`;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            {/* Folder Header */}
            <div className="flex items-start gap-4">
                <div className={cn('rounded-xl flex items-center justify-center w-24 h-24', CATEGORY_COLORS.folder)}>
                    <FolderIcon className="h-12 w-12" />
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-semibold text-[var(--color-text)] truncate">
                        {folder.name}
                    </h1>
                    <div className="flex items-center gap-3 mt-2 text-sm text-[var(--color-text-secondary)]">
                        <span className="flex items-center gap-1">
                            <FolderIcon className="h-4 w-4" />
                            Folder
                        </span>
                    </div>
                </div>
            </div>

            {/* Security Badges */}
            <div className="flex flex-wrap gap-2">
                {isPasswordProtected ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium">
                        <Lock className="h-3.5 w-3.5" />
                        Password Protected
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 text-sm font-medium">
                        <Globe className="h-3.5 w-3.5" />
                        Public Access
                    </span>
                )}
                {link.expiresAt && (
                    <span className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                        isExpired
                            ? 'bg-red-500/10 text-red-600'
                            : 'bg-blue-500/10 text-blue-600'
                    )}>
                        <Clock className="h-3.5 w-3.5" />
                        {isExpired ? 'Expired' : `Expires ${new Date(link.expiresAt).toLocaleDateString()}`}
                    </span>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
                <Button
                    variant="outline"
                    onClick={handleCopyLink}
                    leftIcon={copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <ExternalLink className="h-4 w-4" />}
                    className="flex-1 sm:flex-none"
                >
                    {copied ? 'Link Copied!' : 'Copy Link'}
                </Button>
            </div>

            {/* Folder Info */}
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-4 space-y-3">
                <h3 className="font-medium text-[var(--color-text)]">Folder Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-[var(--color-text-muted)]">Type</p>
                        <p className="text-[var(--color-text)]">Folder</p>
                    </div>
                    <div>
                        <p className="text-[var(--color-text-muted)]">Created</p>
                        <p className="text-[var(--color-text)]">{new Date(folder.$createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p className="text-[var(--color-text-muted)]">Modified</p>
                        <p className="text-[var(--color-text)]">{new Date(folder.$updatedAt).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Note for folders */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-blue-700">Folder Sharing</h4>
                        <p className="text-sm text-blue-600 mt-1">
                            This folder has been shared with you. To view its contents, please contact the owner 
                            or sign in if you have an account with access to this folder.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export const SharedResourceView = memo(function SharedResourceView({ resource, link, downloadUrl, viewUrl }: SharedResourceViewProps) {
    const isFile = 'mimeType' in resource;

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-4">
                    {isFile ? (
                        <FilePreview file={resource as FileDocument} downloadUrl={downloadUrl} viewUrl={viewUrl} />
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 bg-[var(--color-surface-elevated)] rounded-xl">
                            <div className={cn('rounded-xl flex items-center justify-center w-32 h-32', CATEGORY_COLORS.folder)}>
                                <FolderIcon className="h-16 w-16" />
                            </div>
                            <p className="mt-4 text-lg font-medium text-[var(--color-text)]">
                                {(resource as Folder).name}
                            </p>
                            <p className="mt-2 text-[var(--color-text-secondary)] text-sm text-center">
                                Folder preview is not available in public sharing.
                                <br />
                                Sign in to view folder contents.
                            </p>
                        </div>
                    )}
                </div>

                {/* Sidebar with Details */}
                <div className="lg:col-span-1">
                    {isFile ? (
                        <FileDetails file={resource as FileDocument} link={link} downloadUrl={downloadUrl} />
                    ) : (
                        <FolderDetails folder={resource as Folder} link={link} />
                    )}
                </div>
            </div>
        </div>
    );
});

export default SharedResourceView;
