import { useState, useEffect, useCallback, useRef } from 'react';
import { client, databases, AppwriteConfig } from '@/lib/appwrite';
import { useAuth } from './useAuth';
import { ID, Query } from 'appwrite';

interface PresenceUser {
    userId: string;
    userName: string;
    userEmail: string;
    lastSeen: Date;
    folderId: string;
}

interface UsePresenceOptions {
    folderId: string | null;
    pollingInterval?: number;
    staleThreshold?: number;
}

interface UsePresenceReturn {
    activeUsers: PresenceUser[];
    isConnected: boolean;
    updatePresence: () => Promise<void>;
}

const PRESENCE_COLLECTION = AppwriteConfig.collections.presence;
const DEFAULT_POLLING_INTERVAL = 30000;
const DEFAULT_STALE_THRESHOLD = 60000;


// Global flag to disable presence if collection is missing across the app lifecycle
let isPresenceFeatureDisabled = false;

export function usePresence({
    folderId,
    pollingInterval = DEFAULT_POLLING_INTERVAL,
    staleThreshold = DEFAULT_STALE_THRESHOLD,
}: UsePresenceOptions): UsePresenceReturn {
    const { user } = useAuth();
    const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const presenceDocId = useRef<string | null>(null);
    const unsubscribeRef = useRef<(() => void) | null>(null);
    const presenceDisabled = useRef(isPresenceFeatureDisabled);


    const updatePresence = useCallback(async () => {
        if (!user || !folderId || presenceDisabled.current) return;

        try {
            const now = new Date().toISOString();
            const data = {
                userId: user.$id,
                userName: user.name || 'Anonymous',
                userEmail: user.email,
                folderId,
                lastSeen: now,
            };

            if (presenceDocId.current) {
                // Update existing doc
                await databases.updateDocument(
                    AppwriteConfig.databaseId,
                    PRESENCE_COLLECTION,
                    presenceDocId.current,
                    { lastSeen: now, folderId }
                );
            } else {
                // Check if doc exists
                const existing = await databases.listDocuments(
                    AppwriteConfig.databaseId,
                    PRESENCE_COLLECTION,
                    [Query.equal('userId', user.$id), Query.limit(1)]
                );

                if (existing.total > 0) {
                    presenceDocId.current = existing.documents[0].$id;
                    await databases.updateDocument(
                        AppwriteConfig.databaseId,
                        PRESENCE_COLLECTION,
                        presenceDocId.current,
                        { lastSeen: now, folderId }
                    );
                } else {
                    // Create new doc
                    const doc = await databases.createDocument(
                        AppwriteConfig.databaseId,
                        PRESENCE_COLLECTION,
                        ID.unique(),
                        data
                    );
                    presenceDocId.current = doc.$id;
                }
            }
        } catch (err: any) {
            if (err?.code === 404 || err?.message?.includes('not found') || err?.type === 'collection_not_found') {
                if (!presenceDisabled.current) {
                    console.warn('[Presence] Feature disabled (update): Collection not found.');
                    presenceDisabled.current = true;
                    isPresenceFeatureDisabled = true;
                }
                return;
            }
            console.error('Presence update failed:', err);
        }
    }, [user, folderId]);


    // Fetch active users in the same folder
    const fetchActiveUsers = useCallback(async () => {
        if (!folderId || presenceDisabled.current) {
            if (!folderId) setActiveUsers([]);
            return;
        }

        try {
            const staleTime = new Date(Date.now() - staleThreshold).toISOString();
            const response = await databases.listDocuments(
                AppwriteConfig.databaseId,
                PRESENCE_COLLECTION,
                [
                    Query.equal('folderId', folderId),
                    Query.greaterThan('lastSeen', staleTime),
                    Query.limit(50),
                ]
            );

            const users: PresenceUser[] = response.documents
                .filter((doc) => doc.userId !== user?.$id)
                .map((doc) => ({
                    userId: doc.userId,
                    userName: doc.userName,
                    userEmail: doc.userEmail,
                    lastSeen: new Date(doc.lastSeen),
                    folderId: doc.folderId,
                }));

            setActiveUsers(users);
        } catch (err: any) {
            // If collection not found, disable presence to prevent spam
            if (err?.code === 404 || err?.message?.includes('not found') || err?.type === 'collection_not_found') {
                if (!presenceDisabled.current) {
                    console.warn('[Presence] Feature disabled: Collection not found.');
                    presenceDisabled.current = true;
                    isPresenceFeatureDisabled = true;
                    setIsConnected(false);
                }
                return;
            }
            console.error('Failed to fetch active users:', err);
        }
    }, [folderId, staleThreshold, user?.$id]);


    useEffect(() => {
        if (!folderId || presenceDisabled.current) return;

        const channel = `databases.${AppwriteConfig.databaseId}.collections.${PRESENCE_COLLECTION}.documents`;
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;
        const reconnectDelay = 2000;
        let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

        const subscribe = () => {
            // Skip if presence is disabled
            if (presenceDisabled.current) return;
            
            try {
                const unsubscribe = client.subscribe(channel, (_response) => {

                    fetchActiveUsers();
                });

                unsubscribeRef.current = unsubscribe;
                reconnectAttempts = 0;


                setTimeout(() => setIsConnected(true), 0);
            } catch (err) {
                console.warn('Realtime subscription failed (presence feature disabled):', err);
                setTimeout(() => setIsConnected(false), 0);
                
                // Disable presence feature to prevent continuous retries
                presenceDisabled.current = true;
                isPresenceFeatureDisabled = true;


                // Don't retry if subscription itself fails
                return;
            }
        };

        // Only subscribe if presence feature is enabled
        if (!presenceDisabled.current) {
            subscribe();
        }


        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && !unsubscribeRef.current && !presenceDisabled.current) {
                reconnectAttempts = 0;
                subscribe();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
            }
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [folderId, fetchActiveUsers]);


    useEffect(() => {
        if (!folderId || presenceDisabled.current) return;

        setTimeout(() => {
            fetchActiveUsers();
            updatePresence();
        }, 0);

        const interval = setInterval(() => {
            updatePresence();
            fetchActiveUsers();
        }, pollingInterval);

        return () => clearInterval(interval);
    }, [folderId, fetchActiveUsers, updatePresence, pollingInterval]);


    useEffect(() => {
        return () => {
            if (presenceDocId.current && user) {

                databases
                    .deleteDocument(
                        AppwriteConfig.databaseId,
                        PRESENCE_COLLECTION,
                        presenceDocId.current
                    )
                    .catch(() => {

                    });
            }
        };
    }, [user]);

    return {
        activeUsers,
        isConnected,
        updatePresence,
    };
}
