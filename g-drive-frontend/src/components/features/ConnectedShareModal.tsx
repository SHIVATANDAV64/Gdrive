

import { useCallback } from 'react';
import { ShareModal } from './ShareModal';
import { useShare } from '@/hooks/useShare';





interface ConnectedShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    resourceType: 'file' | 'folder';
    resourceId: string;
    resourceName: string;
}





export function ConnectedShareModal({
    isOpen,
    onClose,
    resourceType,
    resourceId,
    resourceName,
}: ConnectedShareModalProps) {
    const {
        shares,
        isLoadingShares,
        createShare,
        deleteShare,
        updateShare,
        link,
        createLink,
        deleteLink,
    } = useShare({ resourceType, resourceId });



    const sharedWith = (shares as any[]).map((share) => ({
        id: share.$id,
        email: share.granteeUser?.email || share.granteeUserId,
        name: share.granteeUser?.name,
        role: share.role as 'viewer' | 'editor',
    }));


    const handleAddShare = useCallback(async (email: string, role: 'viewer' | 'editor') => {
        await createShare({ granteeEmail: email, role });
    }, [createShare]);


    const handleRemoveShare = useCallback(async (shareId: string) => {
        await deleteShare(shareId);
    }, [deleteShare]);


    const handleChangeRole = useCallback(async (shareId: string, role: 'viewer' | 'editor') => {
        await updateShare({ shareId, role });
    }, [updateShare]);


    const handleCreateLink = useCallback(async (): Promise<string> => {
        const result = await createLink({ role: 'viewer' });

        const baseUrl = window.location.origin;
        return `${baseUrl}/s/${result.token}`;
    }, [createLink]);


    const handleDeleteLink = useCallback(async () => {
        if (link?.$id) {
            await deleteLink(link.$id);
        }
    }, [deleteLink, link]);


    const publicLinkUrl = link ? `${window.location.origin}/s/${link.token}` : null;


    if (!resourceId) {
        return null;
    }

    return (
        <ShareModal
            isOpen={isOpen}
            onClose={onClose}
            resourceName={resourceName}
            resourceType={resourceType}
            sharedWith={isLoadingShares ? [] : sharedWith}
            onAddShare={handleAddShare}
            onRemoveShare={handleRemoveShare}
            onChangeRole={handleChangeRole}
            publicLink={publicLinkUrl}
            onCreateLink={handleCreateLink}
            onDeleteLink={handleDeleteLink}
        />
    );
}

export default ConnectedShareModal;
