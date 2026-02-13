

import { databases, AppwriteConfig, Query } from '@/lib/appwrite';
import type { FileDocument } from '@/types';





export interface StorageQuota {

    totalBytes: number;

    usedBytes: number;

    usedPercentage: number;

    fileCount: number;
}






const DEFAULT_QUOTA_BYTES = 10 * 1024 * 1024 * 1024;






export async function getStorageUsage(): Promise<StorageQuota> {
    try {


        const response = await databases.listDocuments(
            AppwriteConfig.databaseId,
            AppwriteConfig.collections.files,
            [
                Query.equal('isDeleted', false),
                Query.limit(1000),
            ]
        );

        const files = response.documents as unknown as FileDocument[];


        const usedBytes = files.reduce((total, file) => total + (file.sizeBytes || 0), 0);


        const totalBytes = parseInt(
            import.meta.env.VITE_STORAGE_QUOTA_BYTES || String(DEFAULT_QUOTA_BYTES),
            10
        );


        const usedPercentage = Math.min(100, Math.round((usedBytes / totalBytes) * 100));

        return {
            totalBytes,
            usedBytes,
            usedPercentage,
            fileCount: files.length,
        };
    } catch (error) {
        console.error('[getStorageUsage] Error:', error);

        return {
            totalBytes: DEFAULT_QUOTA_BYTES,
            usedBytes: 0,
            usedPercentage: 0,
            fileCount: 0,
        };
    }
}


export function formatStorageSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);


    const decimals = i >= 3 ? 1 : 0;
    return `${value.toFixed(decimals)} ${units[i]}`;
}


export async function hasStorageSpace(fileSizeBytes: number): Promise<boolean> {
    const quota = await getStorageUsage();
    return (quota.usedBytes + fileSizeBytes) <= quota.totalBytes;
}





export const storageService = {
    getStorageUsage,
    formatStorageSize,
    hasStorageSpace,
};

export default storageService;
