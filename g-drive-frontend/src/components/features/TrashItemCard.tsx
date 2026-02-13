 

import { Folder as FolderIcon, File as FileIcon, Loader2, RotateCcw, XCircle } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';





export interface TrashItem {
    $id: string;
    name: string;
    ownerId: string;
    isDeleted: boolean;
    $updatedAt: string;
    resourceType: 'file' | 'folder';
    sizeBytes?: number;
    mimeType?: string;
}

interface TrashItemCardProps {
    item: TrashItem;
    daysLeft: number;
    isActioning: boolean;
    onRestore: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
}





export function TrashItemCard({ item, daysLeft, isActioning, onRestore, onDelete }: TrashItemCardProps) {
    return (
        <div
            className="group relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[20px] p-[24px] hover:bg-[var(--color-surface-elevated)] transition-all duration-200 hover:shadow-md hover:-translate-y-1"
        >
            { }
            <div className="absolute top-4 right-4">
                <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${daysLeft <= 3
                    ? 'bg-red-500/10 text-red-600'
                    : 'bg-yellow-500/10 text-yellow-600'
                    }`}>
                    {daysLeft} days left
                </span>
            </div>

            { }
            <div className="flex items-center gap-4 mb-[20px]">
                <div className={`p-3.5 rounded-2xl opacity-80 ${item.resourceType === 'folder'
                    ? 'bg-blue-500/10 text-blue-600'
                    : 'bg-purple-500/10 text-purple-600'
                    }`}>
                    {item.resourceType === 'folder' ? (
                        <FolderIcon className="h-8 w-8" />
                    ) : (
                        <FileIcon className="h-8 w-8" />
                    )}
                </div>
            </div>

            { }
            <h3 className="font-semibold text-[16px] text-[var(--color-text)] truncate pr-10" title={item.name}>
                {item.name}
            </h3>

            { }
            <p className="text-sm text-[var(--color-text-muted)] mt-1.5 font-medium">
                {item.resourceType === 'file' && item.sizeBytes
                    ? formatFileSize(item.sizeBytes)
                    : 'Folder'}
            </p>

            { }
            <div className="flex gap-3 mt-[24px]">
                <button
                    onClick={onRestore}
                    disabled={isActioning}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-[var(--color-primary)] text-white rounded-xl hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 hover:shadow-lg hover:shadow-blue-500/20"
                >
                    {isActioning ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RotateCcw className="h-4 w-4" />
                    )}
                    Restore
                </button>
                <button
                    onClick={onDelete}
                    disabled={isActioning}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-red-500"
                    aria-label={`Delete ${item.name} permanently`}
                >
                    <XCircle className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}

export default TrashItemCard;
