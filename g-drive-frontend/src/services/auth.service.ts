

import { account, databases, AppwriteConfig, ID } from '@/lib/appwrite';
import { OAuthProvider } from 'appwrite';





interface LoginCredentials {
    email: string;
    password: string;
}

interface SignupCredentials {
    email: string;
    password: string;
    name: string;
}

interface User {
    $id: string;
    email: string;
    name: string;
    emailVerification: boolean;
    prefs: Record<string, unknown>;
}

export async function ensureUserProfile(user: User): Promise<void> {
    try {
        // Try to get the document
        try {
            await databases.getDocument(
                AppwriteConfig.databaseId,
                AppwriteConfig.collections.users,
                user.$id
            );
            // If it exists, we could update it here if email/name changed, 
            // but for now, just existing is enough.
        } catch (error: any) {
            // Only create if it doesn't exist (404)
            if (error?.code === 404) {
                await databases.createDocument(
                    AppwriteConfig.databaseId,
                    AppwriteConfig.collections.users,
                    user.$id,
                    {
                        email: user.email,
                        name: user.name,
                        imageUrl: null,
                    }
                );
                console.log(`[authService] Created missing user profile for ${user.email}`);
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('[authService] ensureUserProfile failed:', error);
        // We log but don't throw to prevent blocking the user experience 
        // if user session is valid but DB sync fails temporarily.
    }
}






export async function getCurrentUser(): Promise<User | null> {
    try {
        const user = await account.get();
        return user as unknown as User;
    } catch (error) {


        if (error instanceof Error && !error.message.includes('not authenticated')) {
            console.error('getCurrentUser error:', error.message);
        }
        return null;
    }
}


export async function login({ email, password }: LoginCredentials): Promise<User> {
    await account.createEmailPasswordSession(email, password);
    const user = await account.get();
    return user as unknown as User;
}


export async function signup({ email, password, name }: SignupCredentials): Promise<User> {
    // 1. Create Appwrite Auth Account
    const accountData = await account.create(ID.unique(), email, password, name);

    // 2. Create Session
    await account.createEmailPasswordSession(email, password);

    const user = await account.get();
    const typedUser = user as unknown as User;

    // 3. Ensure Profile exists
    await ensureUserProfile(typedUser);

    return typedUser;
}


export async function logout(): Promise<void> {
    await account.deleteSession('current');
}


export async function logoutAll(): Promise<void> {
    await account.deleteSessions();
}


export function loginWithGoogle(
    successUrl: string = window.location.origin,
    failureUrl: string = `${window.location.origin}/login`
): void {
    account.createOAuth2Session(
        OAuthProvider.Google,
        successUrl,
        failureUrl
    );
}


export async function requestPasswordReset(email: string): Promise<void> {
    const resetUrl = `${window.location.origin}/reset-password`;
    await account.createRecovery(email, resetUrl);
}


export async function resetPassword(
    userId: string,
    secret: string,
    newPassword: string
): Promise<void> {
    await account.updateRecovery(userId, secret, newPassword);
}


export async function updateName(name: string): Promise<User> {
    const user = await account.updateName(name);
    return user as unknown as User;
}


export async function updatePassword(
    newPassword: string,
    oldPassword: string
): Promise<User> {
    const user = await account.updatePassword(newPassword, oldPassword);
    return user as unknown as User;
}


export async function updateEmail(
    email: string,
    password: string
): Promise<User> {
    const user = await account.updateEmail(email, password);
    return user as unknown as User;
}


export async function requestEmailVerification(): Promise<void> {
    const verifyUrl = `${window.location.origin}/verify-email`;
    await account.createVerification(verifyUrl);
}


export async function verifyEmail(userId: string, secret: string): Promise<void> {
    await account.updateVerification(userId, secret);
}

export const authService = {
    getCurrentUser,
    login,
    signup,
    logout,
    logoutAll,
    loginWithGoogle,
    requestPasswordReset,
    resetPassword,
    updateName,
    updatePassword,
    updateEmail,
    requestEmailVerification,
    verifyEmail,
    ensureUserProfile,
};

export default authService;
