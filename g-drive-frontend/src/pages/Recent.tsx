 

import { useState, useCallback } from 'react';
import { Clock, File, Download, Eye, RefreshCw, AlertCircle } from 'lucide-react';
import { useRecentFiles } from '@/hooks/useFiles';
import { formatFileSize, getRelativeTime, getFileTypeLabel } from '@/lib/utils';
import { Button } from '@/components/ui';
import { PreviewModal } from '@/components/features/preview';
import { storage, AppwriteConfig } from '@/lib/appwrite';
import type { FileDocument } from '@/types';





function LoadingState() {
    return (
        <div className="space-y-4">
            <div className="h-8 w-32 skeleton rounded-lg" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]"
                    >
                        <div className="w-10 h-10 rounded-lg skeleton" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-3/4 skeleton rounded" />
                            <div className="h-3 w-1/2 skeleton rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
            <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mb-6">
                <Clock className="h-10 w-10 text-[var(--color-primary)]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-text)] mb-2">
                No recent files
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm max-w-md">
                Files you've recently accessed will appear here for quick access.
            </p>
        </div>
    );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-[var(--color-danger)]/10 flex items-center justify-center mb-6">
                <AlertCircle className="h-8 w-8 text-[var(--color-danger)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                Failed to load recent files
            </h3>
            <p className="text-[var(--color-text-secondary)] text-sm max-w-sm mb-6">
                Something went wrong. Please try again.
            </p>
            <Button
                variant="secondary"
                onClick={onRetry}
                leftIcon={<RefreshCw className="h-4 w-4" />}
            >
                Try again
            </Button>
        </div>
    );
}

// ============================================================
// Main Component
// ============================================================

export default function RecentPage() {
    const { data: files, isLoading, error, refetch } = useRecentFiles(20);

    // Preview state
    const [previewFile, setPreviewFile] = useState<FileDocument | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');

    const handleFilePreview = useCallback((file: FileDocument) => {
        const url = storage.getFileView(AppwriteConfig.buckets.userFiles, file.storageKey);
        setPreviewUrl(url);
        setPreviewFile(file);
    }, []);

    const handleClosePreview = useCallback(() => {
        setPreviewFile(null);
        setPreviewUrl('');
    }, []);

    const handleDownload = useCallback((file: FileDocument) => {
        const url = storage.getFileDownload(AppwriteConfig.buckets.userFiles, file.storageKey);
        window.open(url, '_blank');
    }, []);

    if (isLoading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState onRetry={() => refetch()} />;
    }

    if (!files || files.length === 0) {
        return <EmptyState />;
    }

    return (
        <div className="space-y-6 page-enter">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-[var(--color-text)] flex items-center gap-2">
                    <Clock className="h-6 w-6 text-[var(--color-primary)]" />
                    Recent
                </h1>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetch()}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                >
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {files.map((file, index) => (
                    <div
                        key={file.$id}
                        className="group flex items-center gap-3 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-elevated)] transition-all cursor-pointer stagger-item"
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() => handleFilePreview(file)}
                    >
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--color-secondary)]/10 shrink-0">
                            <File className="h-5 w-5 text-[var(--color-secondary)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-[var(--color-text)] truncate">{file.name}</p>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                {getFileTypeLabel(file.mimeType)} • {formatFileSize(file.sizeBytes)}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)]">
                                {getRelativeTime(file.$updatedAt)}
                            </p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleFilePreview(file);
                                }}
                                className="p-1.5 rounded-lg hover:bg-[var(--color-surface-muted)] transition-colors"
                                title="Preview"
                            >
                                <Eye className="h-4 w-4 text-[var(--color-text-secondary)]" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(file);
                                }}
                                className="p-1.5 rounded-lg hover:bg-[var(--color-surface-muted)] transition-colors"
                                title="Download"
                            >
                                <Download className="h-4 w-4 text-[var(--color-text-secondary)]" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            { }
            <PreviewModal
                file={previewFile}
                isOpen={!!previewFile}
                onClose={handleClosePreview}
                onDownload={handleDownload}
                previewUrl={previewUrl}
            />
        </div>
    );
}
