# G-Drive Frontend

React SPA for the G-Drive cloud storage platform.

## Stack

- React 19 + TypeScript 5.9
- Vite 7 (dev server on port 3000)
- Tailwind CSS 4
- TanStack Query for server state
- Appwrite SDK for auth, storage, and function calls
- Framer Motion for animations
- Zod for validation

## Setup

```bash
npm install
cp .env.example .env   # fill in your Appwrite credentials
npm run dev
```

See [SETUP.md](SETUP.md) for the full Appwrite setup walkthrough including collection schemas and backend function deployment.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at `http://localhost:3000` |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

## Source Structure

```
src/
├── components/
│   ├── ui/              # Button, Modal, Input, Breadcrumb, Toast, etc.
│   ├── layout/          # Sidebar, Header, MainLayout, Toolbar
│   ├── features/        # FileCard, FolderCard, ShareModal, ContextMenu,
│   │                      # UploadDropzone, UploadProgressWidget, TagManager, etc.
│   │   ├── preview/     # PreviewModal, ImagePreview, VideoPreview,
│   │   │                # AudioPreview, PDFPreview, TextPreview
│   │   └── viewers/     # (reserved)
│   └── dashboard/       # Dashboard-specific components
├── pages/               # Route-level components (lazy-loaded)
├── hooks/               # useAuth, useFiles, useFolders, useShare, useUpload, etc.
├── services/            # Appwrite API wrappers (one per domain)
├── context/             # UploadContext, ViewModeContext
├── lib/                 # appwrite client, constants, utils, schemas, queryClient
├── types/               # TypeScript interfaces (File, Folder, Share, etc.)
└── assets/
```

## Pages

| Route | Page | Access |
|-------|------|--------|
| `/` | Dashboard (My Drive) | Auth |
| `/folder/:id` | Folder contents | Auth |
| `/shared` | Shared with me | Auth |
| `/starred` | Starred items | Auth |
| `/recent` | Recent files | Auth |
| `/trash` | Trash | Auth |
| `/activity` | Activity log | Auth |
| `/settings` | Profile settings | Auth |
| `/login` | Login | Public |
| `/signup` | Sign up | Public |
| `/forgot-password` | Password recovery | Public |
| `/s/:token` | Public shared link | Public |

## Architecture Notes

- **Services** call Appwrite Functions via `functions.createExecution()` with REST-like paths (e.g., `GET /`, `POST /`, `PATCH /:id`). Some reads use `databases.getDocument()` directly.
- **Hooks** wrap services with TanStack Query for caching, optimistic updates, and invalidation.
- **File uploads** go directly to Appwrite Storage, then a function call creates the metadata document.
- **Path alias**: `@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).
- **Code splitting**: React lazy loading for all pages. Vendor chunks split for React, TanStack Query, and Appwrite SDK.

## Build

```bash
npm run build    # output in dist/
```

Production build uses esbuild minification with no sourcemaps. Vendor chunking is configured in `vite.config.ts`.
