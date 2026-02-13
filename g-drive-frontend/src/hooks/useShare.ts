 

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getShares,
    createShare,
    updateShare,
    deleteShare,
    getLinkShare,
    createLinkShare,
    deleteLinkShare,
    starItem,
    unstarItem,
    getStarredItems,
} from '@/services/share.service';
import { QUERY_KEYS } from '@/lib/constants';





interface UseShareOptions {
    resourceType: 'file' | 'folder';
    resourceId: string;
}





export function useShare({ resourceType, resourceId }: UseShareOptions) {
    const queryClient = useQueryClient();

    
    
    

    
    const sharesQuery = useQuery({
        queryKey: QUERY_KEYS.shares.forResource(resourceType, resourceId),
        queryFn: () => getShares(resourceType, resourceId),
        staleTime: 30 * 1000, 
    });

    
    const linkQuery = useQuery({
        queryKey: QUERY_KEYS.links.forResource(resourceType, resourceId),
        queryFn: () => getLinkShare(resourceType, resourceId),
        staleTime: 30 * 1000,
    });

    
    
    

    const createShareMutation = useMutation({
        mutationFn: (data: { granteeEmail: string; role: 'viewer' | 'editor' }) =>
            createShare({
                resourceType,
                resourceId,
                granteeEmail: data.granteeEmail,
                role: data.role,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.shares.forResource(resourceType, resourceId),
            });
        },
    });

    const updateShareMutation = useMutation({
        mutationFn: ({ shareId, role }: { shareId: string; role: 'viewer' | 'editor' }) =>
            updateShare(shareId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.shares.forResource(resourceType, resourceId),
            });
        },
    });

    const deleteShareMutation = useMutation({
        mutationFn: (shareId: string) => deleteShare(shareId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.shares.forResource(resourceType, resourceId),
            });
        },
    });

    
    
    

    const createLinkMutation = useMutation({
        mutationFn: (data: { role?: 'viewer' | 'editor'; password?: string; expiresAt?: string }) =>
            createLinkShare({
                resourceType,
                resourceId,
                ...data,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.links.forResource(resourceType, resourceId),
            });
        },
    });

    const deleteLinkMutation = useMutation({
        mutationFn: (linkId: string) => deleteLinkShare(linkId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.links.forResource(resourceType, resourceId),
            });
        },
    });

    
    
    

    return {
        
        shares: sharesQuery.data ?? [],
        isLoadingShares: sharesQuery.isLoading,
        createShare: createShareMutation.mutateAsync,
        updateShare: updateShareMutation.mutateAsync,
        deleteShare: deleteShareMutation.mutateAsync,
        isCreatingShare: createShareMutation.isPending,

        
        link: linkQuery.data ?? null,
        isLoadingLink: linkQuery.isLoading,
        createLink: createLinkMutation.mutateAsync,
        deleteLink: deleteLinkMutation.mutateAsync,
        isCreatingLink: createLinkMutation.isPending,
    };
}





export function useStars() {
    const queryClient = useQueryClient();

    
    const { data: stars = [], isLoading } = useQuery({
        queryKey: QUERY_KEYS.stars.all,
        queryFn: getStarredItems,
        staleTime: 60 * 1000, 
    });

    
    const starMutation = useMutation({
        mutationFn: ({ resourceType, resourceId }: { resourceType: 'file' | 'folder'; resourceId: string }) =>
            starItem(resourceType, resourceId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stars.all });
        },
    });

    
    const unstarMutation = useMutation({
        mutationFn: (starId: string) => unstarItem(starId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stars.all });
        },
    });

    
    const isStarred = (resourceType: 'file' | 'folder', resourceId: string): boolean => {
        return stars.some(
            (s) => s.star.resourceType === resourceType && s.star.resourceId === resourceId
        );
    };

    
    const getStarId = (resourceType: 'file' | 'folder', resourceId: string): string | null => {
        const star = stars.find(
            (s) => s.star.resourceType === resourceType && s.star.resourceId === resourceId
        );
        return star?.star.$id ?? null;
    };

    
    const toggleStar = async (resourceType: 'file' | 'folder', resourceId: string) => {
        const starId = getStarId(resourceType, resourceId);
        if (starId) {
            await unstarMutation.mutateAsync(starId);
        } else {
            await starMutation.mutateAsync({ resourceType, resourceId });
        }
    };

    return {
        stars,
        isLoading,
        isStarred,
        toggleStar,
        isToggling: starMutation.isPending || unstarMutation.isPending,
    };
}

export default useShare;
