# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Geo Portal is a full-stack location-based portal application built with Next.js 15, React 19, TypeScript, PostgreSQL, Prisma ORM, and Socket.io. Users create, discover, and interact with geo-anchored portals featuring real-time chat, reactions, leaderboards, and spatial search.

## Commands

### Development
```bash
docker compose up -d          # Start PostgreSQL
npx prisma migrate dev        # Run DB migrations
npx prisma generate           # Regenerate Prisma client
npm run dev                   # Dev server on :3000 (custom server.ts with Socket.io)
```

### Testing
```bash
npm test                      # All tests (64 tests, 11 suites, requires test DB)
npm test -- --testPathPattern=auth    # Run a single test file by pattern
npm run test:integration      # API integration tests (runs in-band)
```

### Build & Lint
```bash
npm run build                 # Next.js production build
npm start                     # Production server (ts-node server.ts)
npm run lint                  # ESLint
```

### Seed Data
```bash
npm run prisma:seed           # Load 4 demo users + 23 portals in Bogot\u00e1 area
npx ts-node prisma/seed-delete.ts  # Remove seed data (identified by @geoportal.com emails)
```

## Architecture

### Custom Server
`server.ts` wraps the Next.js request handler with a Node HTTP server to attach Socket.io. This is required because Next.js doesn't natively support WebSocket servers. The global `io` instance is accessed by API routes to emit real-time events (`portal:created`, `portal:updated`, `portal:deleted`, `chat:message`).

### Spatial System (Two-Layer)
- **SQL layer** (`lib/spatial.ts`): Haversine distance query with bounding-box pre-filter using the `(latitude, longitude)` compound index. Used by `/api/portals/nearby`.
- **H3 layer** (`lib/h3Spatial.ts`): Uber's hexagonal grid at resolution 15 (~0.9m cells). Portals are snapped to hex centers on creation to prevent GPS drift and enable collision detection. Key constant: `MIN_PORTAL_DISTANCE_M = 5`.

### Auth Flow
JWT stored in httpOnly/secure/sameSite=strict cookies. `lib/auth.ts` handles signing, verification, and cookie management. Token invalidation uses `user.tokenVersion` — bumping it invalidates all existing tokens. `getAuthUser(request)` is the standard way to check auth in API routes.

### Rate Limiting
In-memory sliding-window limiter in `lib/rateLimit.ts`. Limits vary by endpoint (e.g., 5/min register, 10/min login, 1/min/IP/portal for visits). Tests call `resetStore()` in setup to clear state between runs.

### API Pattern
All API routes follow: rate limit check → auth check (if needed) → Zod validation via `safeParse` → business logic → Socket.io emit (on mutations). Error responses use helpers from `lib/errors.ts` returning `{error, code?}`.

### Frontend Data Flow
- **Server state**: TanStack React Query (`hooks/usePortals.ts`, `hooks/useSpatialSearch.ts`)
- **Auth state**: React Context (`hooks/useAuth.tsx`)
- **Real-time**: Socket.io client singleton (`lib/socket.ts`) integrated into query hooks for cache invalidation
- **Styling**: Tailwind CSS with dark theme (gray-950 background)

### Database
PostgreSQL with Prisma ORM. 5 models: User, Portal, PortalVisit, PortalMessage, PortalReaction. All portal relations use CASCADE delete. UUID primary keys throughout. Path alias `@/` maps to project root.

### File Uploads
`POST /api/upload` validates MIME type against a magic-bytes allowlist (JPEG, PNG, WebP, MP4), generates UUID filenames, stores in `UPLOAD_DIR` (default `./uploads`). Files served via `/api/files/[filename]`.

## Key Conventions

- `@/` path alias resolves to project root (used in all imports)
- All API validation uses Zod schemas defined in `lib/validation.ts`
- 24 portal categories across 4 sections (portal, outdoor, forsale, other) and 7 portal styles — both defined as enums in Prisma schema and mirrored in validation
- Cursor-based pagination for all list endpoints
- Test helpers in `__tests__/helpers.ts`: `createTestUser()`, `createTestPortal()`, `buildRequest()`, `cleanDatabase()`
- Integration tests call route handlers directly (no HTTP server needed)
- `.env.test` is loaded by `jest.setup.ts` for test database config
