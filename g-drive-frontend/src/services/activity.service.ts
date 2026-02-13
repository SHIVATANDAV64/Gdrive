import { databases, AppwriteConfig, Query } from '@/lib/appwrite';
import type { AppwriteDocument } from '@/types';

 
export interface Activity extends AppwriteDocument {
    actorId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    context: string;
}

 
export async function getActivities(): Promise<Activity[]> {
    try {
        const response = await databases.listDocuments(
            AppwriteConfig.databaseId,
            AppwriteConfig.collections.activities,
            [
                Query.orderDesc('$createdAt'),
                Query.limit(50),
            ]
        );

        return response.documents as unknown as Activity[];
    } catch (error) {
        console.error('[getActivities] Error:', error);
        throw error;
    }
}

const activityService = {
    getActivities,
};

export default activityService;
