 

import { useQuery } from '@tanstack/react-query';
import { getStorageUsage, type StorageQuota } from '@/services/storage.service';
import { QUERY_KEYS } from '@/lib/constants';





 
export function useStorage() {
    return useQuery<StorageQuota>({
        queryKey: QUERY_KEYS.storage,
        queryFn: getStorageUsage,
        staleTime: 5 * 60 * 1000, 
        refetchOnWindowFocus: false,
    });
}

export default useStorage;
