
import { useState, useCallback, useRef, useEffect } from 'react';
import { useFolders } from '@/hooks/useFolders';
import { useFiles } from '@/hooks/useFiles';
import { useUploadContext } from '@/context/UploadContext';
import { useAppActions } from '@/hooks/useAppActions';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Modal } from '@/components/ui';
import type { FileDocument, Folder as FolderType } from '@/types';
import { FilterChips } from '@/components/features/FilterChips';
import { FileExplorer } from '@/components/features/FileExplorer';
import { FileCard } from '@/components/features/FileCard';
import { PreviewModal } from '@/components/features/preview';
import { ConfirmDeleteModal } from '@/components/features/ConfirmDeleteModal';
import { ConnectedShareModal } from '@/components/features/ConnectedShareModal';
import { MoveModal } from '@/components/features/MoveModal';
import { storage, AppwriteConfig } from '@/lib/appwrite';
import { shareService } from '@/services/share.service';
import { moveFiles } from '@/services/file.service';
import { Loader2 } from 'lucide-react';











export default function DashboardPage() {
    const navigate = useNavigate();
    const { folders, isLoading: foldersLoading, error: foldersError, createFolder, deleteFolder, updateFolder } = useFolders(null);
    const { files, isLoading: filesLoading, error: filesError, deleteFile, updateFile } = useFiles(null);


    const { uploadTrigger, newFolderTrigger } = useAppActions();


    const prevUploadTrigger = useRef(uploadTrigger);
    const prevNewFolderTrigger = useRef(newFolderTrigger);

    // Listen to sidebar triggers for upload and new folder
    useEffect(() => {
        if (uploadTrigger !== prevUploadTrigger.current) {
            prevUploadTrigger.current = uploadTrigger;
            fileInputRef.current?.click();
        }
    }, [uploadTrigger]);

    useEffect(() => {
        if (newFolderTrigger !== prevNewFolderTrigger.current) {
            prevNewFolderTrigger.current = newFolderTrigger;
            setNewFolderName('');
            setShowNewFolderModal(true);
        }
    }, [newFolderTrigger]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { uploadFiles } = useUploadContext();


    const [previewFile, setPreviewFile] = useState<FileDocument | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');


    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);

    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameTarget, setRenameTarget] = useState<{ type: 'file' | 'folder'; id: string; name: string } | null>(null);
    const [newName, setNewName] = useState('');
    const [isRenaming, setIsRenaming] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'file' | 'folder'; id: string; name: string } | null>(null);

    const [showShareModal, setShowShareModal] = useState(false);
    const [shareTarget, setShareTarget] = useState<{ type: 'file' | 'folder'; id: string; name: string } | null>(null);

    const [showMoveModal, setShowMoveModal] = useState(false);
    const [moveTarget, setMoveTarget] = useState<{ type: 'file' | 'folder'; id: string; name: string } | null>(null);

    const isLoading = foldersLoading || filesLoading;
    const hasError = foldersError || filesError;

    const [activeFilter, setActiveFilter] = useState<string | null>(null);



    const filteredFiles = activeFilter
        ? files.filter(f => {
            if (activeFilter === 'type') return ['image/jpeg', 'image/png'].includes(f.mimeType); // Mock 'Type' filter
            if (activeFilter === 'people') return f.ownerId; // Mock 'People'
            if (activeFilter === 'modified') return true; // Mock 'Modified'
            return true;
        })
        : files;



    const handleUploadClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            uploadFiles(Array.from(selectedFiles));
        }

        e.target.value = '';
    }, [uploadFiles]);


    const handleNewFolder = useCallback(() => {
        setNewFolderName('');
        setShowNewFolderModal(true);
    }, []);

    const handleCreateFolder = useCallback(async () => {
        if (!newFolderName.trim()) return;
        setIsCreatingFolder(true);
        try {
            await createFolder({ name: newFolderName.trim(), parentId: null });
            setShowNewFolderModal(false);
            setNewFolderName('');
        } catch (error) {
            console.error('Failed to create folder:', error);
        } finally {
            setIsCreatingFolder(false);
        }
    }, [newFolderName, createFolder]);

    const handleFolderClick = (folderId: string) => {
        navigate(`/folder/${folderId}`);
    };


    const handleRenameFolder = useCallback((folder: FolderType) => {
        setRenameTarget({ type: 'folder', id: folder.$id, name: folder.name });
        setNewName(folder.name);
        setShowRenameModal(true);
    }, []);

    const handleRenameFile = useCallback((file: FileDocument) => {
        setRenameTarget({ type: 'file', id: file.$id, name: file.name });
        setNewName(file.name);
        setShowRenameModal(true);
    }, []);

    const handleRename = useCallback(async () => {
        if (!renameTarget || !newName.trim()) return;
        setIsRenaming(true);
        try {
            if (renameTarget.type === 'folder') {
                await updateFolder({ folderId: renameTarget.id, input: { name: newName.trim() } });
            } else {
                await updateFile({ fileId: renameTarget.id, input: { name: newName.trim() } });
            }
            setShowRenameModal(false);
            setRenameTarget(null);
            setNewName('');
        } catch (error) {
            console.error('Failed to rename:', error);
        } finally {
            setIsRenaming(false);
        }
    }, [renameTarget, newName, updateFolder, updateFile]);


    const handleDeleteFolder = useCallback((folder: FolderType) => {
        setDeleteTarget({ type: 'folder', id: folder.$id, name: folder.name });
        setShowDeleteModal(true);
    }, []);

    const handleDeleteFile = useCallback((file: FileDocument) => {
        setDeleteTarget({ type: 'file', id: file.$id, name: file.name });
        setShowDeleteModal(true);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!deleteTarget) return;
        try {
            if (deleteTarget.type === 'folder') {
                await deleteFolder(deleteTarget.id);
            } else {
                await deleteFile(deleteTarget.id);
            }
            setShowDeleteModal(false);
            setDeleteTarget(null);
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    }, [deleteTarget, deleteFolder, deleteFile]);


    const handleShareFolder = useCallback((folder: FolderType) => {
        setShareTarget({ type: 'folder', id: folder.$id, name: folder.name });
        setShowShareModal(true);
    }, []);

    const handleShareFile = useCallback((file: FileDocument) => {
        setShareTarget({ type: 'file', id: file.$id, name: file.name });
        setShowShareModal(true);
    }, []);

    const handleBulkShare = useCallback((items: { id: string; type: 'file' | 'folder'; name: string }[]) => {
        // For bulk share, we'll share the first selected item
        // (sharing multiple items simultaneously isn't typically supported)
        if (items.length > 0) {
            const firstItem = items[0];
            setShareTarget({ type: firstItem.type, id: firstItem.id, name: firstItem.name });
            setShowShareModal(true);
        }
    }, []);

    // Move handlers
    const handleMoveFolder = useCallback((folder: FolderType) => {
        setMoveTarget({ type: 'folder', id: folder.$id, name: folder.name });
        setShowMoveModal(true);
    }, []);

    const handleMoveFile = useCallback((file: FileDocument) => {
        setMoveTarget({ type: 'file', id: file.$id, name: file.name });
        setShowMoveModal(true);
    }, []);

    const handleConfirmMove = useCallback(async (targetFolderId: string | null) => {
        if (!moveTarget) return;
        
        if (moveTarget.type === 'folder') {
            await updateFolder({ folderId: moveTarget.id, input: { parentId: targetFolderId } });
        } else {
            await moveFiles([moveTarget.id], targetFolderId ?? '');
        }
        
        // Refresh the data
        window.location.reload(); // Simple refresh - could be improved with query invalidation
    }, [moveTarget, updateFolder]);


    const handleStarFile = useCallback(async (file: FileDocument) => {
        try {
            await shareService.starItem('file', file.$id);
            // Optionally add toast or visual feedback here
            console.log('File starred:', file.name);
        } catch (error) {
            console.error('Failed to star file:', error);
        }
    }, []);

    const handleStarFolder = useCallback(async (folder: FolderType) => {
        try {
            await shareService.starItem('folder', folder.$id);
            console.log('Folder starred:', folder.name);
        } catch (error) {
            console.error('Failed to star folder:', error);
        }
    }, []);


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



    return (
        <div className="flex flex-col h-full bg-[var(--color-background)]">
            {/* Home Header */}
            <div className="px-6 pt-6 pb-2">
                <h1 className="text-2xl font-normal text-[var(--color-text)] mb-4">Welcome to Drive</h1>

                <FilterChips
                    chips={[
                        { id: 'type', label: 'Type', active: activeFilter === 'type', onRemove: () => setActiveFilter(null) },
                        { id: 'people', label: 'People', active: activeFilter === 'people', onRemove: () => setActiveFilter(null) },
                        { id: 'modified', label: 'Modified', active: activeFilter === 'modified', onRemove: () => setActiveFilter(null) },
                    ]}
                    onSelect={setActiveFilter}
                    className="mb-6"
                />

                {hasError && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm border border-red-200">
                        Failed to load files or folders. Please check your connection or try refreshing.
                        {(foldersError as any)?.message && <div className="mt-1 font-mono text-xs text-red-500">Folders: {(foldersError as any).message}</div>}
                        {(filesError as any)?.message && <div className="mt-1 font-mono text-xs text-red-500">Files: {(filesError as any).message}</div>}
                    </div>
                )}


            </div>

            {/* Main Unified File Explorer */}
            <div className="flex-1 overflow-hidden">
                <FileExplorer
                    currentFolderId={null}
                    folders={folders}
                    files={filteredFiles}
                    path={[{ id: 'root', name: 'My Drive' }]}
                    isLoading={isLoading}
                    onNewFolder={handleNewFolder}
                    onUpload={() => fileInputRef.current?.click()}
                    onRenameFolder={handleRenameFolder}
                    onDeleteFolder={handleDeleteFolder}
                    onMoveFolder={handleMoveFolder}
                    onShareFolder={handleShareFolder}
                    onRenameFile={handleRenameFile}
                    onDeleteFile={handleDeleteFile}
                    onMoveFile={handleMoveFile}
                    onDownloadFile={handleDownload}
                    onShareFile={handleShareFile}
                    onStarFile={handleStarFile}
                    onStarFolder={handleStarFolder}
                    onPreviewFile={handleFilePreview}
                    onBulkShare={handleBulkShare}
                />
            </div>

            {/* Modals */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                aria-label="Upload files"
            />

            <PreviewModal
                file={previewFile}
                isOpen={!!previewFile}
                onClose={handleClosePreview}
                onDownload={handleDownload}
                previewUrl={previewUrl}
            />

            <Modal
                isOpen={showNewFolderModal}
                onClose={() => setShowNewFolderModal(false)}
                title="New Folder"
            >
                <div className="space-y-4">
                    <Input
                        placeholder="Folder name"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                        autoFocus
                    />
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setShowNewFolderModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateFolder}
                            disabled={!newFolderName.trim() || isCreatingFolder}
                            leftIcon={isCreatingFolder ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                        >
                            {isCreatingFolder ? 'Creating...' : 'Create'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={showRenameModal}
                onClose={() => setShowRenameModal(false)}
                title={`Rename ${renameTarget?.type === 'folder' ? 'Folder' : 'File'}`}
            >
                <div className="space-y-4">
                    <Input
                        placeholder="New name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                        autoFocus
                    />
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setShowRenameModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRename}
                            disabled={!newName.trim() || isRenaming}
                            leftIcon={isRenaming ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                        >
                            {isRenaming ? 'Renaming...' : 'Rename'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {
                showDeleteModal && deleteTarget && (
                    <ConfirmDeleteModal
                        isOpen={true}
                        itemName={deleteTarget.name}
                        onConfirm={handleConfirmDelete}
                        onCancel={() => {
                            setShowDeleteModal(false);
                            setDeleteTarget(null);
                        }}
                    />
                )
            }

            {
                shareTarget && (
                    <ConnectedShareModal
                        isOpen={showShareModal}
                        onClose={() => {
                            setShowShareModal(false);
                            setShareTarget(null);
                        }}
                        resourceName={shareTarget.name}
                        resourceType={shareTarget.type}
                        resourceId={shareTarget.id}
                    />
                )
            }

            {
                moveTarget && (
                    <MoveModal
                        isOpen={showMoveModal}
                        onClose={() => {
                            setShowMoveModal(false);
                            setMoveTarget(null);
                        }}
                        onMove={handleConfirmMove}
                        itemName={moveTarget.name}
                        itemType={moveTarget.type}
                        currentFolderId={null}
                        excludeFolderId={moveTarget.type === 'folder' ? moveTarget.id : undefined}
                    />
                )
            }
        </div >
    );
}
