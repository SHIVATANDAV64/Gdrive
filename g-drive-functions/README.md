# G-Drive Backend Functions

Appwrite serverless functions powering the G-Drive storage platform.

## Functions

| Function | Purpose | Methods |
|----------|---------|---------|
| `file-operations` | File CRUD, versioning, recent files, batch delete | GET, POST, PATCH, PUT, DELETE |
| `folder-crud` | Folder CRUD, path resolution, cycle detection | GET, POST, PATCH, DELETE |
| `manage-shares` | User-to-user sharing with Viewer/Editor roles | GET, POST, PATCH, DELETE |
| `manage-links` | Public link generation with password & expiry | GET, POST, DELETE |
| `manage-stars` | Star/unstar files and folders | GET, POST, DELETE |
| `manage-tags` | Custom colored tags for resources | GET, POST, PATCH, DELETE |
| `manage-trash` | Soft delete, restore, permanent delete, empty trash | GET, POST, DELETE |
| `search-files` | Search by name, type, size, date | GET |
| `cleanup-trash` | Scheduled job — deletes items older than 30 days | Cron |

## Architecture

Each function follows the same pattern:

```
functions/<name>/
├── src/
│   └── main.js        # Entry point
└── package.json
```

**Entry point:** `export default async function main(context)` (Appwrite Functions v2)

**Request handling:**
1. Authenticate via `x-appwrite-user-id` header
2. Rate-limit check (100 req/min per user)
3. Route by HTTP method + path segments (REST-style within a single function)
4. Validate input, execute operation, log activity
5. Return `{ success: true, data }` or `{ success: false, error: { code, message } }`

**Security:**
- User authentication on every request
- Ownership verification on mutations
- Inherited share access — walks the folder tree upward to check permissions
- Input validation and safe error responses

## Deployment

### Prerequisites

```bash
npm install -g appwrite-cli
appwrite login
```

### Deploy All

```bash
cd g-drive-functions
appwrite deploy function
```

### Deploy One

```bash
appwrite deploy function --functionId=file-operations
```

### Install Dependencies (per function)

```bash
cd functions/file-operations
npm install
```

## Environment Variables

Set these in **Appwrite Console → Functions → Settings** for each function:

| Variable | Description |
|----------|-------------|
| `APPWRITE_DATABASE_ID` | Main database ID |
| `APPWRITE_API_KEY` | Server API key |
| `COLLECTION_USERS` | Users collection ID |
| `COLLECTION_FOLDERS` | Folders collection ID |
| `COLLECTION_FILES` | Files collection ID |
| `COLLECTION_SHARES` | Shares collection ID |
| `COLLECTION_LINK_SHARES` | Link shares collection ID |
| `COLLECTION_STARS` | Stars collection ID |
| `COLLECTION_ACTIVITIES` | Activities collection ID |
| `BUCKET_USER_FILES` | Storage bucket ID |
| `MAX_FILE_SIZE_BYTES` | Max upload size (default: `104857600` = 100 MB) |
| `TRASH_RETENTION_DAYS` | Days before auto-delete (default: `30`) |
| `MAX_VERSION_HISTORY` | Max versions per file (default: `10`) |

**Function-specific variables** (only set on the relevant function):

| Variable | Function | Description |
|----------|----------|-------------|
| `COLLECTION_RATE_LIMITS` | file-operations | Rate limit tracking collection |
| `COLLECTION_TAGS` | manage-tags | Tags collection ID |
| `COLLECTION_RESOURCE_TAGS` | manage-tags | Resource-tag junction collection ID |
| `CLEANUP_BATCH_SIZE` | cleanup-trash | Items per cleanup run (default: `100`) |

Use `.env.example` for the shared baseline, and function-specific templates at:

- `functions/file-operations/.env.example`
- `functions/folder-crud/.env.example`
- `functions/manage-shares/.env.example`
- `functions/manage-links/.env.example`
- `functions/manage-stars/.env.example`
- `functions/manage-tags/.env.example`
- `functions/manage-trash/.env.example`
- `functions/cleanup-trash/.env.example`
- `functions/search-files/.env.example`

## API Reference

### file-operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List files in a folder |
| GET | `/recent` | Get recent files |
| GET | `/:id` | Get file by ID |
| POST | `/` | Create file metadata |
| POST | `/batch-delete` | Batch soft-delete files |
| PATCH | `/:id` | Update file (rename, move) |
| PUT | `/:id/content` | Update file content (creates new version) |
| DELETE | `/:id` | Delete file |

### folder-crud

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List folders by parentId |
| GET | `/:id` | Get folder |
| GET | `/:id/path` | Get breadcrumb path |
| POST | `/` | Create folder |
| PATCH | `/:id` | Update folder (rename, move) |
| DELETE | `/:id` | Delete folder |

## License

MIT
