# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # dev server at http://localhost:3333
pnpm build        # production build → build/
pnpm preview      # preview production build
pnpm lint         # ESLint check
pnpm lint:fix     # ESLint auto-fix
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest (run all tests)
```

Run a single test file:
```bash
pnpm vitest run tests/demo.test.tsx
```

## Path Alias

`#src/...` maps to `src/...` (configured in both `tsconfig.json` `paths` and `package.json` `imports`). Always use `#src/` for internal imports, never relative paths across directories.

## Project Structure

```
src/
├── api/                  # API services (one folder per domain)
│   ├── service-base.ts   # CrudServiceBase — base class for all services
│   ├── entity-base.ts    # EntityBase interface (id, createdAt, createdBy, …)
│   ├── system/           # System domain: user, role, dept, menu, group
│   ├── setting/          # Settings domain: category, …
│   ├── project/          # Project domain
│   └── task/ sprint/ …   # Other feature domains
├── components/           # Shared UI components
│   ├── basic-table/      # ProTable wrapper with adaptive height
│   ├── basic-content/    # Page container (padding wrapper)
│   ├── basic-form/       # ProForm helpers
│   ├── department-picker/# DepartmentPicker + ProFormDepartmentPicker
│   ├── people-picker/    # User selection
│   └── principal-picker/ # User + group selection
├── hooks/
│   ├── use-access/       # canAccess() + PermissionType enum
│   └── use-preferences/  # Theme, language, layout preferences
├── icons/
│   └── menu-icons.ts     # Registry of all icons usable in route handle.icon
├── layout/               # App shell (header, sidebar, tab bar, content)
│   └── container-layout/ # Used as Component for parent routes
├── locales/
│   ├── vi-VN/            # Vietnamese (default)
│   ├── zh-CN/            # Chinese Simplified
│   └── en-US/            # English
├── pages/                # Feature pages (mirrors api/ domain structure)
│   ├── system/           # user, role, dept, menu, group
│   ├── setting/          # category, …
│   ├── project/
│   └── task/ …
├── router/
│   ├── routes/modules/   # Route files — auto-imported, one file per domain
│   ├── extra-info/       # order.ts (menu sort), route-path.ts
│   └── guard/            # AuthGuard — auth check + route injection on login
├── store/                # Zustand stores: user, access, tabs, preferences (theme/layout)
├── styles/               # Global CSS + Tailwind theme tokens
├── types/                # Shared TypeScript types
└── utils/
    └── request/          # ky HTTP client with auth/refresh interceptors
```

## Architecture

### Module Pattern

Every feature follows this structure — **do not deviate**:

```
src/api/<module>/
  index.ts       # Service class extending CrudServiceBase + singleton export
  types.ts       # Entity interface + SearchParams interface

src/pages/<module>/
  index.tsx            # List page (BasicTable + actionRef + detailRef)
  constants.tsx        # getConstantColumns(t) → ProColumns[]
  components/
    detail.tsx         # ModalForm with useImperativeHandle exposing show(id?)
```

### API Services (`src/api/`)

Extend `CrudServiceBase<T>` from `src/api/service-base.ts`. Pass `populate` for relation fields — the base class auto-transforms populated objects to IDs before POST/PATCH. HTTP client is `ky` via `src/utils/request/index.ts` (handles auth token, language header, 401 refresh, global progress bar).

### Routing (`src/router/`)

- Route modules live in `src/router/routes/modules/` and are **auto-imported** via `import.meta.glob` — adding a file there is enough to register routes.
- Route `handle` metadata drives sidebar menu generation automatically (`title`, `icon`, `order`, `permissions`, `hideInMenu`, `keepAlive`).
- Icon strings in `handle.icon` must be registered in `src/icons/menu-icons.ts`.
- Menu order constants are in `src/router/extra-info/order.ts`.
- Auth flow: `AuthGuard` (wraps all routes) fetches user info + permissions, then calls either `generateRoutesByFrontend` or `generateRoutesFromBackend` depending on `isSendRoutingRequest` flag.

### Permissions (`src/hooks/use-access/`)

- All permission strings are declared as enums in `permission-type.enum.ts`.
- `useAccess().canAccess(PermissionType.X)` gates buttons.
- Route `handle.permissions` declares which button-level permissions a page uses (informational for role management UI).

### State Management (`src/store/`)

Zustand stores: `user` (auth/profile), `access` (routes/menus), `tabs` (open tab bar), `preferences` (theme/language/layout). Auth session is via Supabase (`supabaseClient.ts`).

### i18n (`src/locales/`)

Files are **auto-loaded** via `import.meta.glob`. Filename becomes the top-level namespace key: `src/locales/vi-VN/setting.json` → accessed as `t("setting.category.name")`. Three languages: `vi-VN` (default), `zh-CN`, `en-US`. Always add keys to all three.

### List Page Pattern

```tsx
// actionRef controls table (reload, reset)
// detailRef.current?.show(id?) returns Promise<{isChange}|undefined>
const res = await detailRef.current?.show(id);
if (res?.isChange)
	actionRef.current?.reload();
```

### Detail Modal Pattern

`useImperativeHandle` exposes `show(id?)`. A module-level `guard` variable holds the Promise resolver so the caller can `await show()` and get back `{isChange: true}` after save or `undefined` on cancel.

### Commit Convention

Enforced by commitlint (`@commitlint/config-conventional`):
```
feat | fix | perf | style | docs | test | refactor | build | ci | chore | revert | wip | workflow | types | release
```

Commit messages should contain only the subject line and optional body. No trailer lines of any kind.
