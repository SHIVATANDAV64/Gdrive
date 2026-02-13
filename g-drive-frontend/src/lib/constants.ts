





export const APP_NAME = 'G-Drive';
export const APP_VERSION = '1.0.0';






export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
export const MAX_FILE_SIZE_MB = 100;
export const MAX_STORAGE_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB


export const ALLOWED_MIME_TYPES = [

    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',

    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',

    'text/plain',
    'text/csv',
    'text/markdown',

    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',

    'audio/mpeg',
    'audio/wav',
    'audio/ogg',

    'video/mp4',
    'video/webm',
    'video/ogg',

    'application/json',
    'application/javascript',
    'text/html',
    'text/css',
] as const;


export const FILE_TYPE_CATEGORIES = {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    documents: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown',
    ],
    spreadsheets: [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
    ],
    presentations: [
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    video: ['video/mp4', 'video/webm', 'video/ogg'],
    archives: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
} as const;






export const TRASH_RETENTION_DAYS = 30;






export const LINK_EXPIRY_OPTIONS = [
    { days: 7, label: '7 days' },
    { days: 14, label: '14 days' },
    { days: 30, label: '30 days' },
    { days: null, label: 'Never' },
] as const;


export const DEFAULT_LINK_EXPIRY_DAYS = 7;






export const MAX_VERSION_HISTORY = 10;






export const PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;


export const DEBOUNCE_DELAY_SEARCH = 300;
export const DEBOUNCE_DELAY_RESIZE = 100;


export const TOAST_DURATION = 4000;


export const ANIMATION_DURATION = {
    fast: 150,
    normal: 250,
    slow: 350,
} as const;






export const QUERY_KEYS = {

    auth: {
        user: ['auth', 'user'] as const,
        session: ['auth', 'session'] as const,
    },

    folders: {
        all: ['folders'] as const,
        detail: (id: string) => ['folders', id] as const,
        contents: (id: string | null) => ['folders', 'contents', id ?? 'root'] as const,
        path: (id: string) => ['folders', 'path', id] as const,
    },

    files: {
        all: ['files'] as const,
        detail: (id: string) => ['files', id] as const,
        versions: (id: string) => ['files', id, 'versions'] as const,
        inFolder: (folderId: string | null) => ['files', 'inFolder', folderId ?? 'root'] as const,
    },

    shares: {
        forResource: (type: string, id: string) => ['shares', type, id] as const,
        sharedWithMe: ['shares', 'sharedWithMe'] as const,
    },

    links: {
        forResource: (type: string, id: string) => ['linkShares', type, id] as const,
        byToken: (token: string) => ['linkShares', 'token', token] as const,
    },

    stars: {
        all: ['stars'] as const,
    },

    search: {
        results: (query: string) => ['search', query] as const,
    },

    trash: {
        all: ['trash'] as const,
    },

    recent: {
        all: ['recent'] as const,
    },

    storage: ['storage', 'quota'] as const,
} as const;





export const ROUTES = {

    login: '/login',
    signup: '/signup',
    forgotPassword: '/forgot-password',
    publicLink: '/s/:token',

    dashboard: '/',
    folder: '/folder/:id',
    shared: '/shared',
    starred: '/starred',
    recent: '/recent',
    trash: '/trash',
    activity: '/activity',
    settings: '/settings',
} as const;





export const ERROR_CODES = {

    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    SESSION_EXPIRED: 'SESSION_EXPIRED',

    INVALID_INPUT: 'INVALID_INPUT',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',

    NOT_FOUND: 'NOT_FOUND',
    ALREADY_EXISTS: 'ALREADY_EXISTS',

    SHARE_NOT_FOUND: 'SHARE_NOT_FOUND',
    LINK_EXPIRED: 'LINK_EXPIRED',
    INVALID_PASSWORD: 'INVALID_PASSWORD',

    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;





export const STORAGE_KEYS = {
    viewMode: 'gdrive_view_mode',
    sidebarCollapsed: 'gdrive_sidebar_collapsed',
    theme: 'gdrive_theme',
    recentSearches: 'gdrive_recent_searches',
} as const;
