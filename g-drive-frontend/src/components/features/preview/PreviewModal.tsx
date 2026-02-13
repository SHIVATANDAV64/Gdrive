import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Download,
    Share2,
    ZoomIn,
    ZoomOut,
    RotateCw,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Printer,
    FileText,
    Pencil,
    Save,
    X
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { ImagePreview } from './ImagePreview';
import { PDFPreview } from './PDFPreview';
import { TextPreview } from './TextPreview';
import { VideoPreview } from './VideoPreview';
import { AudioPreview } from './AudioPreview';
import type { FileDocument } from '@/types';

interface PreviewModalProps {
    file: FileDocument | null;
    isOpen: boolean;
    onClose: () => void;
    onDownload?: (file: FileDocument) => void;
    onShare?: (file: FileDocument) => void;
    onSave?: (file: FileDocument, content: string) => Promise<void>;
    previewUrl?: string;
    isLoading?: boolean;
    onNext?: () => void;
    onPrev?: () => void;
    hasNext?: boolean;
    hasPrev?: boolean;
    canEdit?: boolean;
}

type PreviewType = 'image' | 'pdf' | 'text' | 'video' | 'audio' | 'unsupported';

const getPreviewType = (mimeType: string): PreviewType => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (
        mimeType.startsWith('text/') ||
        mimeType === 'application/json' ||
        mimeType === 'application/javascript' ||
        mimeType === 'application/typescript' ||
        mimeType === 'application/xml'
    ) {
        return 'text';
    }
    return 'unsupported';
};

const getLanguageFromMimeType = (mimeType: string, fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const extMap: Record<string, string> = {
        js: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx', py: 'python',
        rb: 'ruby', go: 'go', rs: 'rust', java: 'java', cpp: 'cpp', c: 'c',
        cs: 'csharp', php: 'php', swift: 'swift', kt: 'kotlin', scala: 'scala',
        html: 'html', css: 'css', scss: 'scss', less: 'less', json: 'json',
        xml: 'xml', yaml: 'yaml', yml: 'yaml', md: 'markdown', sql: 'sql',
        sh: 'bash', bash: 'bash', zsh: 'bash', ps1: 'powershell', dockerfile: 'docker',
    };

    if (extMap[ext]) return extMap[ext];

    const mimeMap: Record<string, string> = {
        'application/json': 'json',
        'application/javascript': 'javascript',
        'application/typescript': 'typescript',
        'application/xml': 'xml',
        'text/html': 'html',
        'text/css': 'css',
        'text/markdown': 'markdown',
        'text/plain': 'plaintext',
    };

    return mimeMap[mimeType] || 'plaintext';
};

export function PreviewModal({
    file,
    isOpen,
    onClose,
    onDownload,
    onShare,
    onSave,
    previewUrl,
    isLoading = false,
    onNext,
    onPrev,
    hasNext = false,
    hasPrev = false,
    canEdit = false,
}: PreviewModalProps) {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setZoom(1);
        setRotation(0);
        setIsEditing(false);
        setEditContent('');
    }, [file?.$id]);

    const handleZoomIn = useCallback(() => {
        setZoom((prev) => Math.min(prev + 0.25, 3));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom((prev) => Math.max(prev - 0.25, 0.25));
    }, []);

    const handleRotate = useCallback(() => {
        setRotation((prev) => (prev + 90) % 360);
    }, []);

    const handlePrint = useCallback(() => {
        if (!previewUrl) return;
        const printWindow = window.open(previewUrl, '_blank');
        if (printWindow) {
            printWindow.focus();
            if (file?.mimeType.startsWith('image/')) {
                setTimeout(() => printWindow.print(), 500);
            }
        }
    }, [previewUrl, file]);

    const handleStartEdit = useCallback(async () => {
        if (!previewUrl) return;
        try {
            const response = await fetch(previewUrl);
            const text = await response.text();
            setEditContent(text);
            setIsEditing(true);
        } catch (err) {
            console.error('Failed to load file for editing:', err);
            alert('Failed to load file for editing');
        }
    }, [previewUrl]);

    const handleCancelEdit = useCallback(() => {
        setIsEditing(false);
        setEditContent('');
    }, []);

    const handleSaveEdit = useCallback(async () => {
        if (!file || !onSave) return;
        try {
            setIsSaving(true);
            await onSave(file, editContent);
            setIsEditing(false);
            setEditContent('');
        } catch (err) {
            console.error('Failed to save file:', err);
            alert('Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    }, [file, editContent, onSave]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' && hasNext) onNext?.();
            if (e.key === 'ArrowLeft' && hasPrev) onPrev?.();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, hasNext, hasPrev, onNext, onPrev, onClose]);

    if (!isOpen) return null;

    if (!file && isLoading) {
        return createPortal(
            <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>,
            document.body
        );
    }

    if (!file) return null;

    const previewType = getPreviewType(file.mimeType);
    const language = getLanguageFromMimeType(file.mimeType, file.name);
    const showImageControls = previewType === 'image';
    const isTextFile = previewType === 'text';
    const canEditFile = canEdit && isTextFile;

    const renderPreview = () => {
        if (isEditing && isTextFile) {
            return (
                <div className="w-full h-full flex flex-col bg-[#1e1e1e] rounded-lg overflow-hidden">
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 w-full p-4 bg-[#1e1e1e] text-gray-200 font-mono text-sm resize-none focus:outline-none"
                        style={{ minHeight: '400px' }}
                        spellCheck={false}
                    />
                </div>
            );
        }

        if (!previewUrl && isLoading) {
            return <Loader2 className="w-10 h-10 text-white animate-spin" />;
        }
        if (!previewUrl) return null;

        switch (previewType) {
            case 'image':
                return (
                    <ImagePreview
                        src={previewUrl}
                        alt={file.name}
                        zoom={zoom}
                        rotation={rotation}
                    />
                );
            case 'pdf':
                return <PDFPreview src={previewUrl} />;
            case 'text':
                return <TextPreview src={previewUrl} language={language} />;
            case 'video':
                return <VideoPreview src={previewUrl} />;
            case 'audio':
                return <AudioPreview src={previewUrl} />;
            default:
                return (
                    <div className="flex flex-col items-center justify-center text-white/70">
                        <FileText className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg">Preview not available</p>
                        <p className="text-sm mt-2 opacity-50">{file.mimeType}</p>
                        {onDownload && (
                            <Button
                                variant="outline"
                                className="mt-6 border-white/20 text-white hover:bg-white/10"
                                onClick={() => onDownload(file)}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download to view
                            </Button>
                        )}
                    </div>
                );
        }
    };

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col font-sans"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <div className="h-16 flex items-center justify-between px-6 bg-black/40 border-b border-white/10 shrink-0 select-none z-10 transition-colors hover:bg-black/60">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                            className="p-2 rounded-full hover:bg-white/10 cursor-pointer transition-colors"
                            onClick={onClose}
                            title="Close"
                        >
                            <ChevronLeft className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-white font-medium text-lg truncate" title={file.name}>{file.name}</h2>
                    </div>

                    <div className="flex items-center gap-2">
                        {showImageControls && (
                            <>
                                <Button variant="ghost" size="icon" onClick={handleZoomOut} className="text-white/80 hover:text-white hover:bg-white/10" title="Zoom out">
                                    <ZoomOut className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handleZoomIn} className="text-white/80 hover:text-white hover:bg-white/10" title="Zoom in">
                                    <ZoomIn className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handleRotate} className="text-white/80 hover:text-white hover:bg-white/10" title="Rotate">
                                    <RotateCw className="w-5 h-5" />
                                </Button>
                                <div className="w-px h-5 bg-white/20 mx-2" />
                            </>
                        )}

                        {/* Edit/Save buttons for text files with editor permission */}
                        {canEditFile && !isEditing && (
                            <Button variant="ghost" size="icon" onClick={handleStartEdit} className="text-white/80 hover:text-white hover:bg-white/10" title="Edit">
                                <Pencil className="w-5 h-5" />
                            </Button>
                        )}
                        {isEditing && (
                            <>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={handleCancelEdit} 
                                    className="text-white/80 hover:text-white hover:bg-white/10" 
                                    title="Cancel"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={handleSaveEdit}
                                    disabled={isSaving}
                                    className="text-green-400 hover:text-green-300 hover:bg-green-500/10" 
                                    title="Save"
                                >
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                </Button>
                                <div className="w-px h-5 bg-white/20 mx-2" />
                            </>
                        )}

                        <Button variant="ghost" size="icon" onClick={handlePrint} className="text-white/80 hover:text-white hover:bg-white/10" title="Print">
                            <Printer className="w-5 h-5" />
                        </Button>

                        {onDownload && (
                            <Button variant="ghost" size="icon" onClick={() => onDownload(file)} className="text-white/80 hover:text-white hover:bg-white/10" title="Download">
                                <Download className="w-5 h-5" />
                            </Button>
                        )}
                        {onShare && (
                            <Button variant="ghost" size="icon" onClick={() => onShare(file)} className="text-white/80 hover:text-white hover:bg-white/10" title="Share">
                                <Share2 className="w-5 h-5" />
                            </Button>
                        )}
                    </div>
                </div>

                <div
                    className="flex-1 relative flex items-center justify-center overflow-hidden p-4"
                    onClick={(e) => e.target === e.currentTarget && onClose()}
                >
                    {hasPrev && (
                        <div className="absolute left-4 z-20">
                            <button
                                onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                                className="p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all ring-1 ring-white/10 shadow-lg"
                                title="Previous (Left Arrow)"
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </button>
                        </div>
                    )}

                    <div className="w-full h-full max-w-6xl flex items-center justify-center relative z-10" onClick={(e) => e.stopPropagation()}>
                        {renderPreview()}
                    </div>

                    {hasNext && (
                        <div className="absolute right-4 z-20">
                            <button
                                onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                                className="p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all ring-1 ring-white/10 shadow-lg"
                                title="Next (Right Arrow)"
                            >
                                <ChevronRight className="w-8 h-8" />
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}

