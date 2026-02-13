# G-Drive — Setup Guide

Step-by-step instructions to set up the G-Drive project from scratch.

---

## Prerequisites

- **Node.js** 18+
- **Appwrite** Cloud account or self-hosted instance (v1.5+)
- **Appwrite CLI** — `npm i -g appwrite-cli`

---

## 1. Clone & Install

```bash
git clone https://github.com/SHIVATANDAV64/Gdrive.git
cd G-drive/g-drive-frontend
npm install
```

---

## 2. Appwrite Project Setup

Create a project in Appwrite Console, then set up the following resources.

### 2.1 Database

Create a database (e.g. `gdrive_main`).

### 2.2 Collections

Create these collections inside the database. All string attributes use `size: 36` unless noted.

#### `users`
| Attribute | Type | Required | Size |
|-----------|------|----------|------|
| `email` | string | yes | 320 |
| `name` | string | yes | 128 |
| `imageUrl` | string | no | 2048 |

#### `folders`
| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| `name` | string | yes | size 255 |
| `ownerId` | string | yes | |
| `parentId` | string | no | null = root |
| `isDeleted` | boolean | yes | default false |

#### `files`
| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| `name` | string | yes | size 255 |
| `mimeType` | string | yes | size 128 |
| `sizeBytes` | integer | yes | |
| `storageKey` | string | yes | |
| `ownerId` | string | yes | |
| `folderId` | string | no | null = root |
| `versionId` | string | no | |
| `checksum` | string | no | size 128 |
| `isDeleted` | boolean | yes | default false |

#### `shares`
| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| `resourceType` | string | yes | `file` or `folder`, size 10 |
| `resourceId` | string | yes | |
| `granteeUserId` | string | yes | |
| `role` | string | yes | `viewer` or `editor`, size 10 |
| `createdBy` | string | yes | |

#### `link_shares`
| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| `resourceType` | string | yes | size 10 |
| `resourceId` | string | yes | |
| `token` | string | yes | size 64 |
| `role` | string | yes | `viewer`, size 10 |
| `passwordHash` | string | no | size 255 |
| `expiresAt` | string | no | ISO datetime, size 30 |
| `createdBy` | string | yes | |

#### `stars`
| Attribute | Type | Required |
|-----------|------|----------|
| `userId` | string | yes |
| `resourceType` | string | yes |
| `resourceId` | string | yes |

#### `activities`
| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| `actorId` | string | yes | |
| `action` | string | yes | upload/rename/delete/restore/move/share/download, size 20 |
| `resourceType` | string | yes | size 10 |
| `resourceId` | string | yes | |
| `context` | string | no | JSON string, size 2048 |

#### `presence`
| Attribute | Type | Required |
|-----------|------|----------|
| `userId` | string | yes |
| *(additional fields as needed)* | | |

#### `tags` *(optional — tags feature)*
| Attribute | Type | Required | Size |
|-----------|------|----------|------|
| `userId` | string | yes | 36 |
| `name` | string | yes | 50 |
| `color` | string | yes | 7 |

Index: `userId_name` — unique on `[userId, name]`

#### `resource_tags` *(optional — tags feature)*
| Attribute | Type | Required | Size |
|-----------|------|----------|------|
| `tagId` | string | yes | 36 |
| `resourceType` | string | yes | 10 |
| `resourceId` | string | yes | 36 |
| `userId` | string | yes | 36 |

Indexes:
- `tag_resource` — unique on `[tagId, resourceType, resourceId]`
- `resource_lookup` — key on `[resourceType, resourceId]`

### 2.3 Storage Bucket

Create a bucket (e.g. `user_files`). Set max file size to 100 MB.

### 2.4 API Key

Create a Server API key with permissions for: databases, storage, functions, users.

---

## 3. Deploy Backend Functions

```bash
appwrite login
cd g-drive-functions
appwrite deploy function
```

Set environment variables on **each function** in Appwrite Console → Functions → Settings → Variables.

Common variables (all functions):

```env
APPWRITE_DATABASE_ID=your-database-id
APPWRITE_API_KEY=your-server-api-key
COLLECTION_USERS=your-users-collection-id
COLLECTION_FOLDERS=your-folders-collection-id
COLLECTION_FILES=your-files-collection-id
COLLECTION_SHARES=your-shares-collection-id
COLLECTION_LINK_SHARES=your-link-shares-collection-id
COLLECTION_STARS=your-stars-collection-id
COLLECTION_ACTIVITIES=your-activities-collection-id
BUCKET_USER_FILES=your-user-files-bucket-id
MAX_FILE_SIZE_BYTES=104857600
TRASH_RETENTION_DAYS=30
MAX_VERSION_HISTORY=10
```

Function-specific variables:

| Variable | Function | Default |
|----------|----------|---------|
| `COLLECTION_RATE_LIMITS` | file-operations | *(rate limit collection id)* |
| `COLLECTION_TAGS` | manage-tags | *(tags collection id)* |
| `COLLECTION_RESOURCE_TAGS` | manage-tags | *(resource_tags collection id)* |
| `CLEANUP_BATCH_SIZE` | cleanup-trash | `100` |

---

## 4. Configure Frontend Environment

```bash
cd g-drive-frontend
cp .env.example .env
```

Fill in `.env` — reference the `.env.example` for all required keys.

The function IDs should match the deployed function IDs from the Appwrite Console. If you used the default names during deployment, they'll be: `folder-crud`, `file-operations`, `manage-shares`, `manage-links`, `search-files`, `manage-trash`, `manage-stars`, `manage-tags`.

---

## 5. Run

```bash
npm run dev
```

Opens at `http://localhost:3000`.

---

## Application Defaults

| Setting | Value |
|---------|-------|
| Max file size | 100 MB |
| Max storage per user | 10 GB |
| Trash retention | 30 days |
| Max version history | 10 versions |
| Page size | 25 items |
| Link expiry options | 7 / 14 / 30 days / Never |
