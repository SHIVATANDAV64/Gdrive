import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    AlertCircle,
    Loader2,
    FileText,
    Image as ImageIcon,
    Music,
    Video,
    RefreshCw
} from 'lucide-react';
import { useUploadContext, type UploadItem } from '@/context/UploadContext';
import { cn, formatFileSize } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';

const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-purple-500" />;
    if (mimeType.startsWith('video/')) return <Video className="w-4 h-4 text-red-500" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-4 h-4 text-amber-500" />;
    return <FileText className="w-4 h-4 text-blue-500" />;
};

export function UploadProgressWidget() {
    const {
        uploads,
        cancelUpload,
        retryUpload,
        clearCompleted,
        minimized,
        toggleMinimized
    } = useUploadContext();

    if (uploads.length === 0) return null;

    const activeUploads = uploads.filter(u => u.status === 'uploading' || u.status === 'pending');
    const failedUploads = uploads.filter(u => u.status === 'error');
    const completedUploads = uploads.filter(u => u.status === 'success');

    // Calculate overall progress if desired, or just show list
    const isFinished = activeUploads.length === 0;

    return (
        <div className="fixed bottom-0 right-4 w-[360px] bg-white rounded-t-xl shadow-2xl border border-gray-200 z-[100] overflow-hidden flex flex-col font-sans">
            {/* Header */}
            <div
                className="bg-[#333] text-white px-4 py-3 cursor-pointer flex items-center justify-between"
                onClick={toggleMinimized}
            >
                <div className="flex items-center gap-2">
                    <span className="font-medium text-[15px]">
                        {isFinished
                            ? `${completedUploads.length} uploads complete`
                            : `Uploading ${activeUploads.length} item${activeUploads.length !== 1 ? 's' : ''}`
                        }
                    </span>
                    {failedUploads.length > 0 && (
                        <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                            {failedUploads.length} failed
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-300 hover:text-white hover:bg-white/10"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleMinimized();
                        }}
                    >
                        {minimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-300 hover:text-white hover:bg-white/10"
                        onClick={(e) => {
                            e.stopPropagation();
                            clearCompleted();
                        }}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* List */}
            <AnimatePresence initial={false}>
                {!minimized && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="bg-white max-h-[300px] overflow-y-auto"
                    >
                        <div className="divide-y divide-gray-100">
                            {[...activeUploads, ...failedUploads, ...completedUploads].map((item) => (
                                <UploadItemRow
                                    key={item.id}
                                    item={item}
                                    onCancel={() => cancelUpload(item.id)}
                                    onRetry={() => retryUpload(item.id)}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function UploadItemRow({
    item,
    onCancel,
    onRetry
}: {
    item: UploadItem;
    onCancel: () => void;
    onRetry: () => void;
}) {
    return (
        <div className="px-4 py-3 group hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                    {getFileIcon(item.file.type)}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-700 truncate max-w-[180px]" title={item.file.name}>
                            {item.file.name}
                        </p>
                        <div className="flex items-center gap-2">
                            {item.status === 'error' && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-gray-400 hover:text-red-500"
                                    onClick={onRetry}
                                    title="Retry"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </Button>
                            )}
                            {(item.status === 'pending' || item.status === 'uploading') && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={onCancel}
                                    title="Cancel"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {item.status === 'uploading' && (
                            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-blue-500 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.progress}%` }}
                                    transition={{ duration: 0.2 }}
                                />
                            </div>
                        )}

                        {item.status === 'success' && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Complete
                            </span>
                        )}

                        {item.status === 'error' && (
                            <span className="text-xs text-red-600 flex items-center gap-1 truncate max-w-[200px]" title={item.error}>
                                <AlertCircle className="w-3 h-3" /> {item.error || 'Failed'}
                            </span>
                        )}

                        {item.status === 'pending' && (
                            <span className="text-xs text-gray-400">Waiting...</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
