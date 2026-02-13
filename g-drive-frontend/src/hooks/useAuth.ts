

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { OAuthProvider, ID } from 'appwrite';
import { account } from '@/lib/appwrite';
import { authService } from '@/services/auth.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { AuthUser } from '@/types';





interface LoginCredentials {
    email: string;
    password: string;
}

interface SignupCredentials {
    email: string;
    password: string;
    name: string;
}









async function fetchCurrentUser(): Promise<AuthUser | null> {
    try {
        const user = await account.get();
        const authUser = user as unknown as AuthUser;

        // Ensure profile exists in DB (Retroactive/Periodic sync)
        if (authUser) {
            // We don't await this to avoid blocking the main auth flow
            authService.ensureUserProfile(authUser as any).catch(err =>
                console.error('[useAuth] Sync failed:', err)
            );
        }

        return authUser;
    } catch {
        return null;
    }
}






export function useAuth() {
    const queryClient = useQueryClient();




    const {
        data: user,
        isLoading,
        error,
        refetch: refetchUser,
    } = useQuery({
        queryKey: QUERY_KEYS.auth.user,
        queryFn: fetchCurrentUser,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: false,
    });




    const loginMutation = useMutation({
        mutationFn: async ({ email, password }: LoginCredentials) => {
            await account.createEmailPasswordSession(email, password);
            const user = await fetchCurrentUser();
            if (user) {
                await authService.ensureUserProfile(user as any);
            }
            return user;
        },
        onSuccess: (user) => {

            queryClient.setQueryData(QUERY_KEYS.auth.user, user);
        },
    });




    const signupMutation = useMutation({
        mutationFn: async ({ email, password, name }: SignupCredentials) => {

            await account.create(ID.unique(), email, password, name);

            await account.createEmailPasswordSession(email, password);
            return fetchCurrentUser();
        },
        onSuccess: (user) => {
            queryClient.setQueryData(QUERY_KEYS.auth.user, user);
        },
    });




    const logoutMutation = useMutation({
        mutationFn: async () => {
            await account.deleteSession('current');
        },
        onSuccess: () => {

            queryClient.setQueryData(QUERY_KEYS.auth.user, null);

            queryClient.clear();
        },
    });

    
    
    
    const logoutAllMutation = useMutation({
        mutationFn: async () => {
            await account.deleteSessions();
        },
        onSuccess: () => {
            
            queryClient.setQueryData(QUERY_KEYS.auth.user, null);
            
            queryClient.clear();
        },
    });



    const loginWithGoogle = useCallback(() => {


        const redirectUrl = window.location.origin;
        account.createOAuth2Session(
            OAuthProvider.Google,
            `${redirectUrl}/`,
            `${redirectUrl}/login`
        );
    }, []);




    const requestPasswordResetMutation = useMutation({
        mutationFn: async (email: string) => {
            const resetUrl = `${window.location.origin}/reset-password`;
            await account.createRecovery(email, resetUrl);
        },
    });

    const resetPasswordMutation = useMutation({
        mutationFn: async ({
            userId,
            secret,
            password
        }: {
            userId: string;
            secret: string;
            password: string;
        }) => {
            await account.updateRecovery(userId, secret, password);
        },
    });




    return {

        user: user ?? null,
        isLoading,
        isAuthenticated: !!user,
        error: error as Error | null,


        login: loginMutation.mutateAsync,
        loginWithGoogle,
        signup: signupMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
        logoutAll: logoutAllMutation.mutateAsync,
        requestPasswordReset: requestPasswordResetMutation.mutateAsync,
        resetPassword: resetPasswordMutation.mutateAsync,
        refetchUser,


        isLoggingIn: loginMutation.isPending,
        isSigningUp: signupMutation.isPending,
        isLoggingOut: logoutMutation.isPending,
        isLoggingOutAll: logoutAllMutation.isPending,
        loginError: loginMutation.error,
        signupError: signupMutation.error,
    };
}






export function useRequireAuth() {
    const { user, isLoading, isAuthenticated } = useAuth();




    return {
        user,
        isLoading,
        isAuthenticated,
    };
}
