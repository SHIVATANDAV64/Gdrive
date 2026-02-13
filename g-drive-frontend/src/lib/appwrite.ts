

import { Client, Account, Databases, Storage, Functions, ID, Query } from 'appwrite';


const client = new Client();


const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

if (!endpoint || !projectId) {
    const errorMsg = 'Missing Appwrite configuration. Please set VITE_APPWRITE_ENDPOINT and VITE_APPWRITE_PROJECT_ID in .env';
    console.error(errorMsg);


    if (import.meta.env.PROD) {
        throw new Error(errorMsg);
    }
}


client
    .setEndpoint(endpoint || 'https://cloud.appwrite.io/v1')
    .setProject(projectId || '');


export const account = new Account(client);


export const databases = new Databases(client);


export const storage = new Storage(client);


export const functions = new Functions(client);


export { ID, Query, client };


function getRequiredEnv(key: string): string {
    const value = import.meta.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}


export const AppwriteConfig = {
    databaseId: getRequiredEnv('VITE_APPWRITE_DATABASE_ID'),
    collections: {
        users: getRequiredEnv('VITE_COLLECTION_USERS'),
        folders: getRequiredEnv('VITE_COLLECTION_FOLDERS'),
        files: getRequiredEnv('VITE_COLLECTION_FILES'),
        shares: getRequiredEnv('VITE_COLLECTION_SHARES'),
        linkShares: getRequiredEnv('VITE_COLLECTION_LINK_SHARES'),
        stars: getRequiredEnv('VITE_COLLECTION_STARS'),
        activities: getRequiredEnv('VITE_COLLECTION_ACTIVITIES'),
        presence: getRequiredEnv('VITE_COLLECTION_PRESENCE'),
        tags: import.meta.env.VITE_COLLECTION_TAGS || '',
        resourceTags: import.meta.env.VITE_COLLECTION_RESOURCE_TAGS || '',
    },
    buckets: {
        userFiles: getRequiredEnv('VITE_BUCKET_USER_FILES'),
    },
    functions: {
        folderCrud: getRequiredEnv('VITE_FUNCTION_FOLDER_CRUD'),
        fileOperations: getRequiredEnv('VITE_FUNCTION_FILE_OPERATIONS'),
        manageShares: getRequiredEnv('VITE_FUNCTION_MANAGE_SHARES'),
        manageLinks: getRequiredEnv('VITE_FUNCTION_MANAGE_LINKS'),
        searchFiles: getRequiredEnv('VITE_FUNCTION_SEARCH_FILES'),
        manageTrash: getRequiredEnv('VITE_FUNCTION_MANAGE_TRASH'),
        manageStars: getRequiredEnv('VITE_FUNCTION_MANAGE_STARS'),
        manageTags: import.meta.env.VITE_FUNCTION_MANAGE_TAGS || '',
    },
} as const;
