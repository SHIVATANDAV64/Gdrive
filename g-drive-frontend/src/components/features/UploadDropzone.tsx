

import {
    useState,
    useRef,
    useCallback,
    type DragEvent
} from 'react';
import { Upload, FileIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { MAX_FILE_SIZE_BYTES } from '@/lib/constants';





import { useUploadContext } from '@/context/UploadContext';

interface UploadDropzoneProps {
    onFilesSelected: (files: File[]) => void;
    multiple?: boolean;
    className?: string;
}





export function UploadDropzone({
    onFilesSelected,
    multiple = true,
    className,
}: UploadDropzoneProps) {
    const { uploadFiles } = useUploadContext();
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            uploadFiles(multiple ? files : [files[0]]);
            onFilesSelected(multiple ? files : [files[0]]);
        }
    }, [onFilesSelected, multiple]);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            uploadFiles(files);
            onFilesSelected(files);
        }

        e.target.value = '';
    }, [onFilesSelected]);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
        }
    };



    return (
        <div className={cn('w-full', className)}>
            { }
            <input
                ref={fileInputRef}
                type="file"
                multiple={multiple}
                onChange={handleFileInputChange}
                className="hidden"
                aria-label="Upload files"
            />

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="button"

                className={cn(
                    'relative border-2 border-dashed rounded-xl p-8',
                    'flex flex-col items-center justify-center',
                    'cursor-pointer transition-all duration-200',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',
                    isDragging
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                        : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface)]'
                )}
            >
                <div className={cn(
                    'w-16 h-16 rounded-full flex items-center justify-center mb-4',
                    'bg-[var(--color-surface-elevated)]'
                )}>
                    <Upload className={cn(
                        'h-8 w-8 transition-colors',
                        isDragging ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'
                    )} />
                </div>

                <p className="text-lg font-medium text-[var(--color-text)] mb-1">
                    {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                    or click to browse
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                    Maximum file size: {formatFileSize(MAX_FILE_SIZE_BYTES)}
                </p>
            </div>

            {/* Upload list removed - handled by Global Widget */}
        </div >
    );
}

export default UploadDropzone;
