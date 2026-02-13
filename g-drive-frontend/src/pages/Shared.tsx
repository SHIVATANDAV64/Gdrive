 

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Folder as FolderIcon, File as FileIcon, Loader2, RefreshCw, Eye, Edit, AlertCircle } from 'lucide-react';
import { shareService } from '@/services/share.service';
import { getFile, getFileWithUrl, updateFileContent } from '@/services/file.service';
import { storage, AppwriteConfig } from '@/lib/appwrite';
import { formatFileSize } from '@/lib/utils';
import { Button } from '@/components/ui';
import { PreviewModal } from '@/components/features/preview';
import type { Share, FileDocument, ShareRole } from '@/types';

interface SharedWithMeResult {
    shares: Share[];
    total: number;
}





function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
            <Loader2 className="h-10 w-10 text-[var(--color-primary)] animate-spin mb-4" />
            <p className="text-[var(--color-text-secondary)]">Loading shared items...</p>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
            <div className="w-20 h-20 rounded-full bg-[var(--color-info)]/10 flex items-center justify-center mb-6">
                <Users className="h-10 w-10 text-[var(--color-info)]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-text)] mb-2">
                Nothing shared with you
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm max-w-md">
                When someone shares files or folders with you, they will appear here.
            </p>
        </div>
    );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-[var(--color-danger)]/10 flex items-center justify-center mb-6">
                <AlertCircle className="h-8 w-8 text-[var(--color-danger)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                Failed to load shared items
            </h3>
            <p className="text-[var(--color-text-secondary)] text-sm max-w-sm mb-6">{error}</p>
            <Button
                onClick={onRetry}
                leftIcon={<RefreshCw className="h-4 w-4" />}
            >
                Try again
            </Button>
        </div>
    );
}





export default function SharedPage() {
    const navigate = useNavigate();
    const [shares, setShares] = useState<Share[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Preview modal state
    const [previewFile, setPreviewFile] = useState<FileDocument | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [currentShareRole, setCurrentShareRole] = useState<ShareRole>('viewer');

    const loadSharedItems = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const items = await shareService.getSharedWithMe();
            
            if (Array.isArray(items)) {
                setShares(items);
            } else {
                const result = items as unknown as SharedWithMeResult;
                setShares(result.shares || []);
            }
        } catch (err) {
            console.error('Failed to load shared items:', err);
            setError(err instanceof Error ? err.message : 'Failed to load shared items');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSharedItems();
    }, [loadSharedItems]);

    const handleItemClick = async (share: Share) => {
        if (share.resourceType === 'folder') {
            navigate(`/folder/${share.resourceId}`);
        } else {
            // For files, fetch file details and open preview
            try {
                setIsLoadingPreview(true);
                setCurrentShareRole(share.role);
                const fileWithUrl = await getFileWithUrl(share.resourceId);
                setPreviewUrl(fileWithUrl.downloadUrl);
                setPreviewFile(fileWithUrl);
            } catch (err) {
                console.error('Failed to load file preview:', err);
                // Fallback: try to just get file details
                try {
                    const file = await getFile(share.resourceId);
                    setPreviewFile(file);
                    setCurrentShareRole(share.role);
                } catch {
                    alert('Unable to open this file. You may not have permission to view it.');
                }
            } finally {
                setIsLoadingPreview(false);
            }
        }
    };

    const handleClosePreview = useCallback(() => {
        setPreviewFile(null);
        setPreviewUrl('');
        setCurrentShareRole('viewer');
    }, []);

    const handleDownload = useCallback((file: FileDocument) => {
        if (file.storageKey) {
            const downloadUrl = storage.getFileDownload(
                AppwriteConfig.buckets.userFiles,
                file.storageKey
            );
            // Open in new tab to trigger download
            window.open(downloadUrl.toString(), '_blank');
        }
    }, []);

    const handleSaveFile = useCallback(async (file: FileDocument, content: string) => {
        try {
            await updateFileContent(file.$id, content);
            // Refresh the file to get updated info
            const updatedFile = await getFileWithUrl(file.$id);
            setPreviewFile(updatedFile);
            setPreviewUrl(updatedFile.downloadUrl);
        } catch (err) {
            console.error('Failed to save file:', err);
            throw err; // Re-throw so PreviewModal can show error
        }
    }, []);

    
    if (isLoading) {
        return <LoadingState />;
    }

    
    if (error) {
        return <ErrorState error={error} onRetry={loadSharedItems} />;
    }

    
    if (shares.length === 0) {
        return <EmptyState />;
    }

    
    return (
        <div className="space-y-6 page-enter">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-[var(--color-text)] flex items-center gap-2">
                    <Users className="h-6 w-6 text-[var(--color-info)]" />
                    Shared with me
                    <span className="text-sm font-normal text-[var(--color-text-muted)]">
                        ({shares.length})
                    </span>
                </h1>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadSharedItems}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                >
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {shares.map((share, index) => (
                    <div
                        key={share.$id}
                        onClick={() => handleItemClick(share)}
                        className="group relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-primary)] transition-all cursor-pointer stagger-item"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        { }
                        <div className="absolute top-3 right-3">
                            <div
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${share.role === 'editor'
                                        ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                                        : 'bg-[var(--color-info)]/10 text-[var(--color-info)]'
                                    }`}
                                title={share.role === 'editor' ? 'Can edit' : 'View only'}
                            >
                                {share.role === 'editor' ? (
                                    <Edit className="h-3 w-3" />
                                ) : (
                                    <Eye className="h-3 w-3" />
                                )}
                                {share.role}
                            </div>
                        </div>

                        { }
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2.5 rounded-xl ${share.resourceType === 'folder'
                                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                    : 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]'
                                }`}>
                                {share.resourceType === 'folder' ? (
                                    <FolderIcon className="h-6 w-6" />
                                ) : (
                                    <FileIcon className="h-6 w-6" />
                                )}
                            </div>
                        </div>

                        { }
                        <h3 className="font-medium text-[var(--color-text)] truncate pr-16" title={share.resource?.name}>
                            {share.resource?.name || (share.resourceType === 'folder' ? 'Shared Folder' : 'Shared File')}
                        </h3>

                        { }
                        <p className="text-sm text-[var(--color-text-muted)] mt-1 capitalize">
                            {share.resourceType}
                            {share.resource?.sizeBytes && share.resourceType === 'file' && (
                                <span className="ml-2">• {formatFileSize(share.resource.sizeBytes)}</span>
                            )}
                        </p>
                    </div>
                ))}
            </div>

            {/* Loading overlay for preview */}
            {isLoadingPreview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-[var(--color-primary)]" />
                        <span>Loading file...</span>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            <PreviewModal
                file={previewFile}
                isOpen={!!previewFile}
                onClose={handleClosePreview}
                previewUrl={previewUrl}
                onDownload={handleDownload}
                canEdit={currentShareRole === 'editor'}
                onSave={handleSaveFile}
            />
        </div>
    );
}
