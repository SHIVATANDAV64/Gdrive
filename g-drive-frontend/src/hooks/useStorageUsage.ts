import { useQuery } from '@tanstack/react-query';
import { databases, AppwriteConfig, Query } from '@/lib/appwrite';
import { MAX_STORAGE_BYTES, QUERY_KEYS } from '@/lib/constants';

interface StorageUsage {
    usedBytes: number;
    totalBytes: number;
    percentage: number;
    isLoading: boolean;
    error: string | null;
}

async function fetchStorageUsage(): Promise<number> {
    // Fetch all files to sum their sizes
    // In a real production app, this should be a cloud function aggregation
    let totalSize = 0;
    let cursor: string | null = null;
    const limit = 100; // Fetch in chunks

    while (true) {
        const queries = [
            Query.limit(limit),
            Query.select(['sizeBytes', 'isDeleted']) // Optimization if supported
        ];

        if (cursor) {
            queries.push(Query.cursorAfter(cursor));
        }

        const response = await databases.listDocuments(
            AppwriteConfig.databaseId,
            AppwriteConfig.collections.files,
            queries
        );

        // Add size of all files (including trash - Google Drive counts trash)
        response.documents.forEach((doc: any) => {
            totalSize += (doc.sizeBytes || 0);
        });

        if (response.documents.length < limit) {
            break;
        }

        cursor = response.documents[response.documents.length - 1].$id;
    }

    return totalSize;
}

export function useStorageUsage(): StorageUsage {
    const { data: usedBytes = 0, isLoading, error } = useQuery({
        queryKey: QUERY_KEYS.storage,
        queryFn: fetchStorageUsage,
        staleTime: 30 * 1000, // Consider data stale after 30 seconds
        refetchInterval: 60 * 1000, // Auto-refetch every minute
        refetchOnWindowFocus: true, // Refetch when user comes back to tab
    });

    const percentage = Math.min((usedBytes / MAX_STORAGE_BYTES) * 100, 100);

    return {
        usedBytes,
        totalBytes: MAX_STORAGE_BYTES,
        percentage,
        isLoading,
        error: error ? 'Failed to load storage usage' : null
    };
}
