 

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

 
const handleQueryError = (error: unknown) => {
    
    console.error('[Query Error]:', error);

    
    
};

 
const handleMutationError = (error: unknown) => {
    console.error('[Mutation Error]:', error);

    
    
};

 
export const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: handleQueryError,
    }),
    mutationCache: new MutationCache({
        onError: handleMutationError,
    }),
    defaultOptions: {
        queries: {
            
            staleTime: 30 * 1000,

            
            gcTime: 5 * 60 * 1000,

            
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

            
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            refetchOnMount: true,

            
            networkMode: 'offlineFirst',
        },
        mutations: {
            
            retry: 1,
            retryDelay: 1000,

            
            networkMode: 'offlineFirst',
        },
    },
});

 
export const invalidateQueries = async (queryKeyPrefix: readonly unknown[]) => {
    await queryClient.invalidateQueries({ queryKey: queryKeyPrefix });
};

 
export const prefetchQuery = async <T>(
    queryKey: readonly unknown[],
    queryFn: () => Promise<T>
) => {
    await queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 30 * 1000,
    });
};
