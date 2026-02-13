






export interface AppwriteDocument {
    $id: string;
    $createdAt: string;
    $updatedAt: string;
    $permissions: string[];
    $databaseId: string;
    $collectionId: string;
}






export interface User extends AppwriteDocument {
    email: string;
    name: string;
    imageUrl: string | null;
}


export interface AuthUser {
    $id: string;
    email: string;
    name: string;
    emailVerification: boolean;
    status: boolean;
    labels: string[];
    registration: string;
}






export interface Folder extends AppwriteDocument {
    name: string;
    ownerId: string;
    parentId: string | null;
    isDeleted: boolean;
}


export interface FolderWithPath extends Folder {
    path: Folder[];
}


export interface CreateFolderInput {
    name: string;
    parentId: string | null;
}


export interface UpdateFolderInput {
    name?: string;
    parentId?: string | null;
    isDeleted?: boolean;
}






export interface FileDocument extends AppwriteDocument {
    name: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    ownerId: string;
    folderId: string | null;
    versionId: string | null;
    checksum: string | null;
    isDeleted: boolean;
}


export interface FileWithUrl extends FileDocument {
    downloadUrl: string;
    previewUrl?: string;
}


export interface InitUploadInput {
    name: string;
    mimeType: string;
    sizeBytes: number;
    folderId: string | null;
}


export interface InitUploadResponse {
    fileId: string;
    storageKey: string;
}


export interface UpdateFileInput {
    name?: string;
    folderId?: string | null;
    isDeleted?: boolean;
}






export interface FileVersion extends AppwriteDocument {
    fileId: string;
    versionNumber: number;
    storageKey: string;
    sizeBytes: number;
    checksum: string | null;
}






export type ResourceType = 'file' | 'folder';


export type ShareRole = 'viewer' | 'editor';


export interface ShareResource {
    $id: string;
    name: string;
    mimeType?: string | null;
    sizeBytes?: number | null;
    storageKey?: string | null;
    ownerId: string;
}


export interface Share extends AppwriteDocument {
    resourceType: ResourceType;
    resourceId: string;
    granteeUserId: string;
    role: ShareRole;
    createdBy: string;
    resource?: ShareResource | null;
}


export interface ShareWithUser extends Share {
    granteeUser: Pick<User, '$id' | 'email' | 'name' | 'imageUrl'>;
}


export interface CreateShareInput {
    resourceType: ResourceType;
    resourceId: string;
    granteeUserId: string;
    role: ShareRole;
}






export interface LinkShare extends AppwriteDocument {
    resourceType: ResourceType;
    resourceId: string;
    token: string;
    role: 'viewer';
    passwordHash: string | null;
    expiresAt: string | null;
    createdBy: string;
}


export type LinkExpiryOption = 7 | 14 | 30;


export interface CreateLinkShareInput {
    resourceType: ResourceType;
    resourceId: string;
    expiresInDays?: LinkExpiryOption;
    password?: string;
}


export interface CreateLinkShareResponse {
    linkShare: LinkShare;
    shareUrl: string;
}

export interface ResolvedLinkShare {
    link: LinkShare;
    resource: FileDocument | Folder;
    downloadUrl?: string;
    viewUrl?: string;
}






export interface Star extends AppwriteDocument {
    userId: string;
    resourceType: ResourceType;
    resourceId: string;
}


export interface ToggleStarInput {
    resourceType: ResourceType;
    resourceId: string;
}






export type ActivityAction =
    | 'upload'
    | 'rename'
    | 'delete'
    | 'restore'
    | 'move'
    | 'share'
    | 'download';


export interface Activity extends AppwriteDocument {
    actorId: string;
    action: ActivityAction;
    resourceType: ResourceType;
    resourceId: string;
    context: Record<string, unknown>;
}






export interface SearchFilters {
    query: string;
    type?: 'file' | 'folder' | 'all';
    mimeTypes?: string[];
    ownerId?: string;
    sortBy?: 'name' | 'date' | 'size';
    sortOrder?: 'asc' | 'desc';
    dateRange?: 'today' | 'week' | 'month' | 'year';
}


export type SearchResult = (FileDocument | Folder) & {
    resourceType: ResourceType;
};






export type TrashItem = (FileDocument | Folder) & {
    resourceType: ResourceType;
    deletedAt: string;
};






export interface ApiResponse<T> {
    success: true;
    data: T;
}


export interface ApiError {
    success: false;
    error: {
        code: string;
        message: string;
    };
}


export interface PaginatedResponse<T> {
    documents: T[];
    total: number;
}






export type ViewMode = 'grid' | 'list';


export type SortField = 'name' | 'size' | 'updatedAt' | 'type';


export type SortDirection = 'asc' | 'desc';


export type SidePanelView = 'details' | 'activity' | 'shares' | null;


export interface BreadcrumbItem {
    id: string | null;
    name: string;
}


export interface ContextMenuPosition {
    x: number;
    y: number;
}


export interface SelectionState {
    selectedIds: Set<string>;
    lastSelectedId: string | null;
}






export interface UploadProgress {
    fileId: string;
    fileName: string;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
}


export interface UploadQueueItem {
    file: File;
    folderId: string | null;
    progress: UploadProgress;
}
