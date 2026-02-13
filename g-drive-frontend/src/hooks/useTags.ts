/**
 * useTags Hook
 * React Query hook for managing tags
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    listTags,
    createTag,
    updateTag,
    deleteTag,
    addTagToResource,
    removeTagFromResource,
    getResourceTags,
    getResourcesByTag,
    type Tag,
} from '@/services/tag.service';

// Query keys
export const TAG_QUERY_KEYS = {
    all: ['tags'] as const,
    list: () => [...TAG_QUERY_KEYS.all, 'list'] as const,
    resource: (resourceType: string, resourceId: string) => 
        [...TAG_QUERY_KEYS.all, 'resource', resourceType, resourceId] as const,
    byTag: (tagId: string) => [...TAG_QUERY_KEYS.all, 'byTag', tagId] as const,
};

/**
 * Hook to list all user's tags
 */
export function useTags() {
    return useQuery({
        queryKey: TAG_QUERY_KEYS.list(),
        queryFn: listTags,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook to get tags for a specific resource
 */
export function useResourceTags(resourceType: 'file' | 'folder', resourceId: string) {
    return useQuery({
        queryKey: TAG_QUERY_KEYS.resource(resourceType, resourceId),
        queryFn: () => getResourceTags(resourceType, resourceId),
        enabled: !!resourceId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/**
 * Hook to get resources by tag
 */
export function useResourcesByTag(tagId: string) {
    return useQuery({
        queryKey: TAG_QUERY_KEYS.byTag(tagId),
        queryFn: () => getResourcesByTag(tagId),
        enabled: !!tagId,
        staleTime: 2 * 60 * 1000,
    });
}

/**
 * Hook for tag mutations (create, update, delete)
 */
export function useTagMutations() {
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: ({ name, color }: { name: string; color?: string }) => createTag(name, color),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TAG_QUERY_KEYS.list() });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ tagId, updates }: { tagId: string; updates: { name?: string; color?: string } }) =>
            updateTag(tagId, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TAG_QUERY_KEYS.all });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (tagId: string) => deleteTag(tagId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TAG_QUERY_KEYS.all });
        },
    });

    const assignMutation = useMutation({
        mutationFn: ({
            tagId,
            resourceType,
            resourceId,
        }: {
            tagId: string;
            resourceType: 'file' | 'folder';
            resourceId: string;
        }) => addTagToResource(tagId, resourceType, resourceId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: TAG_QUERY_KEYS.resource(variables.resourceType, variables.resourceId),
            });
            queryClient.invalidateQueries({
                queryKey: TAG_QUERY_KEYS.byTag(variables.tagId),
            });
        },
    });

    const unassignMutation = useMutation({
        mutationFn: ({
            tagId,
            resourceType,
            resourceId,
        }: {
            tagId: string;
            resourceType: 'file' | 'folder';
            resourceId: string;
        }) => removeTagFromResource(tagId, resourceType, resourceId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: TAG_QUERY_KEYS.resource(variables.resourceType, variables.resourceId),
            });
            queryClient.invalidateQueries({
                queryKey: TAG_QUERY_KEYS.byTag(variables.tagId),
            });
        },
    });

    return {
        createTag: createMutation.mutateAsync,
        updateTag: updateMutation.mutateAsync,
        deleteTag: deleteMutation.mutateAsync,
        assignTag: assignMutation.mutateAsync,
        unassignTag: unassignMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isAssigning: assignMutation.isPending,
        isUnassigning: unassignMutation.isPending,
    };
}
