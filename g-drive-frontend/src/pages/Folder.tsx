
import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFolders } from '@/hooks/useFolders';
import { useFiles } from '@/hooks/useFiles';
import { useUploadContext } from '@/context/UploadContext';
import { useAppActions } from '@/hooks/useAppActions';
import { usePresence } from '@/hooks/usePresence';
import { Loader2 } from 'lucide-react';
import { PreviewModal } from '@/components/features/preview';
import { ConfirmDeleteModal } from '@/components/features/ConfirmDeleteModal';
import { ConnectedShareModal } from '@/components/features/ConnectedShareModal';
import { MoveModal } from '@/components/features/MoveModal';
import { ActiveUsers } from '@/components/features/ActiveUsers';
import { storage, AppwriteConfig } from '@/lib/appwrite';
import { shareService } from '@/services/share.service';
import { moveFiles } from '@/services/file.service';
import { FileExplorer } from '@/components/features/FileExplorer';
import { Button, Input, Modal } from '@/components/ui';
import type { FileDocument, Folder as FolderType } from '@/types';











export default function FolderPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { folder: _folder, folders, path, isLoading: foldersLoading, createFolder, deleteFolder, updateFolder } = useFolders(id ?? null);
    const { files, isLoading: filesLoading, deleteFile, updateFile } = useFiles(id ?? null);
    const { activeUsers } = usePresence({ folderId: id ?? null });


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
    const isEmpty = !isLoading && folders.length === 0 && files.length === 0;


    const handleUploadClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            uploadFiles(Array.from(selectedFiles), id ?? null);
        }
        e.target.value = '';
    }, [uploadFiles, id]);


    const handleNewFolder = useCallback(() => {
        setNewFolderName('');
        setShowNewFolderModal(true);
    }, []);

    const handleCreateFolder = useCallback(async () => {
        if (!newFolderName.trim()) return;
        setIsCreatingFolder(true);
        try {
            await createFolder({ name: newFolderName.trim(), parentId: id ?? null });
            setShowNewFolderModal(false);
            setNewFolderName('');
        } catch (error) {
            console.error('Failed to create folder:', error);
        } finally {
            setIsCreatingFolder(false);
        }
    }, [newFolderName, createFolder, id]);

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

    const handleNext = useCallback(() => {
        if (!previewFile || files.length === 0) return;
        const currentIndex = files.findIndex(f => f.$id === previewFile.$id);
        if (currentIndex !== -1 && currentIndex < files.length - 1) {
            handleFilePreview(files[currentIndex + 1]);
        }
    }, [previewFile, files, handleFilePreview]);

    const handlePrev = useCallback(() => {
        if (!previewFile || files.length === 0) return;
        const currentIndex = files.findIndex(f => f.$id === previewFile.$id);
        if (currentIndex > 0) {
            handleFilePreview(files[currentIndex - 1]);
        }
    }, [previewFile, files, handleFilePreview]);

    const currentIndex = previewFile ? files.findIndex(f => f.$id === previewFile.$id) : -1;
    const hasNext = currentIndex !== -1 && currentIndex < files.length - 1;
    const hasPrev = currentIndex > 0;

    return (
        <div className="flex flex-col h-full bg-[var(--color-background)]">
            <div className="px-6 py-4 flex items-center justify-between">
                {/* Header / Active Users */}
                {activeUsers.length > 0 && (
                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                        <span className="text-xs text-[var(--color-text-muted)] font-medium">Also viewing:</span>
                        <ActiveUsers users={activeUsers} size="sm" />
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-hidden">
                <FileExplorer
                    currentFolderId={id ?? null}
                    folders={folders}
                    files={files}
                    path={path}
                    isLoading={isLoading}
                    onNewFolder={handleNewFolder}
                    onUpload={() => fileInputRef.current?.click()}
                    onRenameFolder={handleRenameFolder}
                    onDeleteFolder={handleDeleteFolder}
                    onMoveFolder={handleMoveFolder}
                    onShareFolder={handleShareFolder}
                    onStarFolder={handleStarFolder}
                    onRenameFile={handleRenameFile}
                    onDeleteFile={handleDeleteFile}
                    onMoveFile={handleMoveFile}
                    onDownloadFile={handleDownload}
                    onShareFile={handleShareFile}
                    onStarFile={handleStarFile}
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
                onNext={handleNext}
                onPrev={handlePrev}
                hasNext={hasNext}
                hasPrev={hasPrev}
            />

            <Modal
                isOpen={showNewFolderModal}
                onClose={() => setShowNewFolderModal(false)}
                title="New Folder"
            >
                <div className="space-y-6">
                    <Input
                        label="Folder Name"
                        placeholder="e.g. Project Assets"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                        autoFocus
                    />
                    <div className="flex justify-end gap-3 pt-2">
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
                            {isCreatingFolder ? 'Creating...' : 'Create Folder'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={showRenameModal}
                onClose={() => setShowRenameModal(false)}
                title={`Rename ${renameTarget?.type === 'folder' ? 'Folder' : 'File'}`}
            >
                <div className="space-y-6">
                    <Input
                        label="Name"
                        placeholder="Enter new name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                        autoFocus
                    />
                    <div className="flex justify-end gap-3 pt-2">
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

            {showDeleteModal && deleteTarget && (
                <ConfirmDeleteModal
                    isOpen={true}
                    itemName={deleteTarget.name}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => {
                        setShowDeleteModal(false);
                        setDeleteTarget(null);
                    }}
                />
            )}

            {shareTarget && (
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
            )}

            {moveTarget && (
                <MoveModal
                    isOpen={showMoveModal}
                    onClose={() => {
                        setShowMoveModal(false);
                        setMoveTarget(null);
                    }}
                    onMove={handleConfirmMove}
                    itemName={moveTarget.name}
                    itemType={moveTarget.type}
                    currentFolderId={id ?? null}
                    excludeFolderId={moveTarget.type === 'folder' ? moveTarget.id : undefined}
                />
            )}
        </div>
    );
}
