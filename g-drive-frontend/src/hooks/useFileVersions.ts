 

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getFileVersions,
    restoreFileVersion,
    deleteFileVersion,
    type FileVersion,
} from '@/services/version.service';





interface UseFileVersionsOptions {
    fileId: string;
    enabled?: boolean;
}

interface UseFileVersionsReturn {
    versions: FileVersion[];
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => void;
    restoreVersion: (versionId: string) => Promise<void>;
    deleteVersion: (versionId: string) => Promise<void>;
    isRestoring: boolean;
    isDeleting: boolean;
}





export function useFileVersions({
    fileId,
    enabled = true,
}: UseFileVersionsOptions): UseFileVersionsReturn {
    const queryClient = useQueryClient();

    
    const {
        data: versions = [],
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ['file-versions', fileId],
        queryFn: () => getFileVersions(fileId),
        enabled: enabled && !!fileId,
        staleTime: 5 * 60 * 1000, 
    });

    
    const restoreMutation = useMutation({
        mutationFn: (versionId: string) => restoreFileVersion(fileId, versionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['file-versions', fileId] });
            queryClient.invalidateQueries({ queryKey: ['files'] });
        },
    });

    
    const deleteMutation = useMutation({
        mutationFn: (versionId: string) => deleteFileVersion(fileId, versionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['file-versions', fileId] });
        },
    });

    return {
        versions,
        isLoading,
        isError,
        error: error as Error | null,
        refetch,
        restoreVersion: async (versionId: string) => {
            await restoreMutation.mutateAsync(versionId);
        },
        deleteVersion: async (versionId: string) => {
            await deleteMutation.mutateAsync(versionId);
        },
        isRestoring: restoreMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}

export default useFileVersions;
