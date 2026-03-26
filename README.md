# Geo Portal

A geo-anchored portal web application. Users drop content portals at real-world coordinates, discover nearby portals on a map, chat in realtime, and climb the leaderboard.

Built with Next.js 15, PostgreSQL, Prisma, Socket.io, Leaflet, and Tailwind CSS.

---

## Table of Contents

- [Quick Start](#quick-start)
- [VPS Deployment](#vps-deployment)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [File Uploads](#file-uploads)
- [Spatial Search](#spatial-search)
- [Realtime (Socket.io)](#realtime-socketio)
- [Frontend Pages](#frontend-pages)
- [Components](#components)
- [Hooks](#hooks)
- [Seed Data](#seed-data)
- [Testing](#testing)
- [Project Structure](#project-structure)

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL (Docker)
docker-compose up -d

# 3. Copy env and configure
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET to a random string

# 4. Run database migrations
npx prisma migrate dev

# 5. Seed demo data
npx prisma db seed

# 6. Start development server
npm run dev
# App runs at http://localhost:3000
```

---

## VPS Deployment

```bash
# On your VPS:
git clone <repo-url> && cd geo-portal
npm install

# Set up PostgreSQL
docker-compose up -d
# Or use your existing PostgreSQL — just set DATABASE_URL

# Configure environment
cp .env.example .env
# REQUIRED: Set a strong JWT_SECRET (64+ random chars)
# REQUIRED: Set DATABASE_URL to your PostgreSQL connection string
# OPTIONAL: Set NEXT_PUBLIC_MAPBOX_TOKEN for Mapbox maps
# OPTIONAL: Set PORTAL_BASE_URL to your domain (used in QR codes)

# Run migrations and seed
npx prisma migrate deploy
npx prisma db seed

# Build and start
npm run build
npm start
# Server runs on port 3000 with Socket.io attached
```

For production, use a process manager like PM2:
```bash
npm install -g pm2
pm2 start npm --name geo-portal -- start
pm2 save
pm2 startup
```

---

## Architecture

```
Client (Browser)
  │
  ├─ Next.js Pages (SSR + Client)
  │    └─ React Components + TanStack Query
  │
  ├─ REST API (Next.js API Routes)
  │    ├─ Auth (JWT httpOnly cookies)
  │    ├─ Portal CRUD (zod-validated)
  │    ├─ Spatial Search (haversine + H3)
  │    ├─ File Upload (validated, UUID-named)
  │    └─ Chat + Reactions
  │
  └─ Socket.io (realtime)
       ├─ portal:created / updated / deleted
       └─ chat:message

Server
  ├─ Custom server.ts (Next.js + Socket.io)
  ├─ PostgreSQL (Prisma ORM)
  └─ Local filesystem (uploads/)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT via httpOnly cookies (bcrypt + jsonwebtoken) |
| Validation | zod |
| Realtime | Socket.io |
| File Storage | Local filesystem (served via API) |
| Maps | Leaflet (free CartoDB tiles) + Mapbox GL (optional) |
| Spatial | h3-js (Uber's hexagonal grid) |
| UI | Tailwind CSS + Framer Motion |
| Data Fetching | TanStack React Query |
| Icons | lucide-react |
| Testing | Jest + ts-jest |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs. Use 64+ random chars in production |
| `PORTAL_BASE_URL` | No | Base URL for QR codes. Default: `http://localhost:3000` |
| `NEXT_PUBLIC_SOCKET_URL` | No | Socket.io server URL. Default: `http://localhost:3000` |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | No | Mapbox access token. If empty, Mapbox map option is disabled |
| `UPLOAD_DIR` | No | File upload directory. Default: `./uploads` |

---

## Database Schema

5 models with cascade deletes on all portal relations:

### User
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| email | String | Unique |
| passwordHash | String | bcrypt, 12 rounds |
| displayName | String? | |
| avatarUrl | String? | |
| tokenVersion | Int | Bumped on password change to invalidate JWTs |
| createdAt | DateTime | |

### Portal
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| ownerId | UUID | FK -> User |
| name | String | 1-100 chars |
| description | String? | Up to 1000 chars |
| latitude | Float | -90 to 90, H3-snapped on creation |
| longitude | Float | -180 to 180, H3-snapped on creation |
| locationName | String? | Reverse-geocoded place name |
| neighborhood | String? | |
| countryCode | String? | |
| portalStyle | Enum? | See Portal Styles below |
| portalType | String? | Free-form type label |
| contentType | Enum? | image, video, website, business_info, mixed_media |
| destinationType | String? | Content routing type |
| destinationMeta | JSON? | Content routing metadata |
| contentUrl | String? | URL to portal content |
| contentMetadata | JSON? | |
| thumbnailUrl | String? | |
| category | String | See Categories below |
| isActive | Boolean | Default true |
| isPublic | Boolean | Default true |
| isHidden | Boolean | Default false (user-toggled visibility) |
| totalVisits | Int | Incremented via /visits endpoint |
| totalInteractions | Int | |
| gigiEarned | Float | Reward points earned |
| placementCost | Float | Cost to place |
| visitReward | Float | Reward per visit |
| placedAt | DateTime | When physically placed |
| createdAt | DateTime | Record creation |
| updatedAt | DateTime | Auto-updated |
| expiresAt | DateTime? | Optional expiration |

**Indexes:** `(latitude, longitude)`, `ownerId`, `category`, `(isActive, isPublic)`

### PortalVisit
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| portalId | UUID | FK -> Portal (CASCADE) |
| userId | UUID? | FK -> User (null for anonymous) |
| sessionId | String? | For anonymous dedup |
| visitedAt | DateTime | |

### PortalMessage
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| portalId | UUID | FK -> Portal (CASCADE) |
| userId | UUID | FK -> User |
| content | String | 1-2000 chars |
| createdAt | DateTime | |

### PortalReaction
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| portalId | UUID | FK -> Portal (CASCADE) |
| userId | UUID | FK -> User |
| reactionType | String | Emoji (e.g. fire, purple_heart) |
| createdAt | DateTime | |
| | | Unique constraint: (portalId, userId, reactionType) |

### Portal Styles (7)

| ID | Label | Description |
|----|-------|-------------|
| neon_ring | Neon Ring | Cyberpunk energy halo |
| holographic_frame | Hologram | Prismatic light matrix |
| vortex_spiral | Vortex | Swirling dimensional rift |
| plasma_gate | Plasma Gate | Ionized particle field |
| space_rift | Space Rift | Torn dimensional gap |
| wormhole | Wormhole | Spacetime tunnel |
| nebula_cloud | Nebula | Cosmic gas cloud |

### Categories (24 across 4 sections)

**Portal:** general, business, food, entertainment, art, shopping, nightlife, community, tech, education

**Outdoor:** fishing, hunting, atv, hiking, camping, foraging, swimming

**For Sale:** houses, cars, land, garage_sales, furniture, electronics

**Other:** other

---

## API Reference

All API routes return JSON. Errors use format: `{ error: string, code?: string }`.

### Auth

| Method | Route | Auth | Rate Limit | Description |
|--------|-------|------|------------|-------------|
| POST | `/api/auth/register` | No | 5/min/IP | Register new user. Body: `{ email, password, displayName? }`. Sets httpOnly cookie. |
| POST | `/api/auth/login` | No | 10/min/IP | Login. Body: `{ email, password }`. Sets httpOnly cookie. |
| GET | `/api/auth/me` | Yes | - | Get current user from cookie. |
| POST | `/api/auth/logout` | No | - | Clears auth cookie. |

### Portals

| Method | Route | Auth | Rate Limit | Description |
|--------|-------|------|------------|-------------|
| GET | `/api/portals` | Optional | - | List portals. Query: `cursor`, `limit` (1-100), `category`, `ownerId` (`me` for own). |
| POST | `/api/portals` | Required | - | Create portal. Body: see createPortalSchema. Coordinates are H3-snapped. |
| GET | `/api/portals/nearby` | No | - | Spatial search. Query: `latitude`, `longitude`, `radius_meters` (1-50000), `limit` (1-200). |
| GET | `/api/portals/[id]` | Optional | - | Portal detail with relation counts. Private portals only visible to owner. |
| PUT | `/api/portals/[id]` | Required | - | Update portal. Owner only (403 otherwise). |
| DELETE | `/api/portals/[id]` | Required | - | Delete portal + all visits/messages/reactions (cascade). Owner only. |
| POST | `/api/portals/[id]/visits` | Optional | 1/min/IP/portal | Log a visit. Increments totalVisits. |
| GET | `/api/portals/[id]/qr` | No | - | Returns SVG QR code pointing to `PORTAL_BASE_URL/portals/[id]`. |
| GET | `/api/portals/[id]/chat` | No | - | Get chat messages. Query: `cursor`, `limit`. Returns chronological order. |
| POST | `/api/portals/[id]/chat` | Required | 10/min/user | Send chat message. Body: `{ content }` (1-2000 chars). |

### Files

| Method | Route | Auth | Rate Limit | Description |
|--------|-------|------|------------|-------------|
| POST | `/api/upload` | Required | 10/min/user | Upload file. Multipart form: `file` field. Max 10MB. Allowed: JPEG, PNG, WebP, MP4. Magic bytes validated. Returns `{ filename, url, size, type }`. |
| GET | `/api/files/[filename]` | No | - | Serve uploaded file with correct Content-Type. Path traversal protected. |

---

## Authentication

- JWT tokens stored in **httpOnly, secure, sameSite=strict** cookies
- Token expiration: **7 days**
- Token payload: `{ userId, tokenVersion }`
- `tokenVersion` field on User is checked on every request. Bumping it invalidates all existing tokens (e.g., on password change)
- Client never handles the token directly -- cookies are set/cleared by the server
- The `getAuthUser(request)` helper extracts and verifies the token from the cookie

---

## Rate Limiting

In-memory sliding-window rate limiter. Limits reset automatically after the window expires.

| Endpoint | Limit | Window | Key |
|----------|-------|--------|-----|
| Register | 5 requests | 1 minute | Per IP |
| Login | 10 requests | 1 minute | Per IP |
| Upload | 10 uploads | 1 minute | Per user |
| Chat (POST) | 10 messages | 1 minute | Per user |
| Visit (POST) | 1 visit | 1 minute | Per IP per portal |

---

## File Uploads

- Files stored in `UPLOAD_DIR` (default `./uploads/`), **outside** the `public/` directory
- Served through `/api/files/[filename]` with access control
- Filenames are **UUID-generated** (user-provided names are ignored, preventing path traversal)
- **MIME type allowlist:** image/jpeg, image/png, image/webp, video/mp4
- **Magic bytes validation:** file content is checked against the declared MIME type
- **Size limit:** 10MB max

---

## Spatial Search

Two layers of spatial logic:

### Haversine Bounding Box (SQL)
`GET /api/portals/nearby` uses a raw PostgreSQL query with:
1. Bounding-box pre-filter using the `(latitude, longitude)` compound index
2. Haversine distance calculation in the SELECT
3. Subquery wrapper to filter by exact radius
4. Results sorted by distance ascending

### H3 Hexagonal Grid (Application)
Portal coordinates are **snapped to H3 hex centers** at resolution 15 (~0.9m precision) on creation. This:
- Prevents GPS drift from repositioning portals
- Enables cell-based proximity checks (portals in same hex = too close)
- Supports hierarchical grouping (res 15 -> res 12 for neighborhood clusters)

Key functions in `lib/h3Spatial.ts`:
- `anchorPortal(lat, lng)` -- snap to hex center
- `findConflict(lat, lng, existingPortals)` -- check minimum 5m distance
- `distanceMeters(lat1, lng1, lat2, lng2)` -- precise geodesic distance
- `getNearbyCells(lat, lng, ringSize)` -- hex neighbors for proximity checks

---

## Realtime (Socket.io)

Custom `server.ts` wraps the Next.js handler and attaches Socket.io.

### Server Events (emitted by API routes)
| Event | Payload | When |
|-------|---------|------|
| `portal:created` | Portal object | New portal created |
| `portal:updated` | Portal object | Portal edited |
| `portal:deleted` | `{ id }` | Portal deleted |
| `chat:message` | Message object | New chat message (scoped to portal room) |

### Client Events
| Event | Payload | Purpose |
|-------|---------|---------|
| `join:portal` | portalId (string) | Join a portal's chat room |
| `leave:portal` | portalId (string) | Leave a portal's chat room |

### Scaling
Socket.io is structured so adding a Redis adapter for horizontal scaling is a one-line change:
```ts
import { createAdapter } from '@socket.io/redis-adapter';
io.adapter(createAdapter(redisClient));
```

---

## Frontend Pages

| URL | Page | Auth | Description |
|-----|------|------|-------------|
| `/` | Home | No | Landing page with links to explore and map |
| `/portals` | Explore | No | Portal feed with category/section filters |
| `/portals/map` | Map | No | Full-screen map with nearby portal markers. Leaflet or Mapbox toggle. |
| `/portals/create` | Create | Yes | Portal editor with location picker, style selector, category picker |
| `/portals/[id]` | Detail | No | Portal detail, QR link, reactions, chat |
| `/my-portals` | My Portals | Yes | Manage owned portals -- edit, toggle visibility, delete |
| `/leaderboard` | Leaderboard | No | Portals ranked by total visits |
| `/auth/login` | Login | No | Email/password login form |
| `/auth/register` | Register | No | Registration form with display name |

---

## Components

### Layout
| Component | File | Purpose |
|-----------|------|---------|
| Providers | `components/layout/Providers.tsx` | QueryClient + AuthProvider wrapper |
| Navbar | `components/layout/Navbar.tsx` | Top nav with auth-aware links |
| AuthGuard | `components/layout/AuthGuard.tsx` | Redirects to login if unauthenticated |

### Map
| Component | File | Purpose |
|-----------|------|---------|
| LeafletMap | `components/map/LeafletMap.tsx` | Free OpenStreetMap with dark CartoDB tiles |
| MapboxMap | `components/map/MapboxMap.tsx` | Mapbox GL map (requires token) |
| MapProviderSelector | `components/map/MapProviderSelector.tsx` | Toggle between map providers |

### Portals
| Component | File | Purpose |
|-----------|------|---------|
| PortalFeed | `components/portals/PortalFeed.tsx` | Filterable portal grid with section/category tabs |
| PortalCard | `components/portals/PortalCard.tsx` | Portal summary card with style, visits, location |
| PortalDetail | `components/portals/PortalDetail.tsx` | Full portal view with stats, reactions, chat |
| PortalEditor | `components/portals/PortalEditor.tsx` | Create/edit form with all 7 styles, 24 categories |
| PortalLocationPicker | `components/portals/PortalLocationPicker.tsx` | Leaflet map with draggable marker + Nominatim reverse geocoding |
| PortalChat | `components/portals/PortalChat.tsx` | Realtime chat via Socket.io |
| PortalReactions | `components/portals/PortalReactions.tsx` | Emoji reaction buttons |
| PortalLeaderboard | `components/portals/PortalLeaderboard.tsx` | Ranked portal list by visits |
| MyPortals | `components/portals/MyPortals.tsx` | Owner portal management -- edit, toggle, delete |

---

## Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useAuth` | `hooks/useAuth.tsx` | Auth context -- login, register, logout, current user. Cookie-based (no token handling). |
| `usePortals` | `hooks/usePortals.ts` | TanStack Query for portal list with Socket.io live updates. Also exports `useMyPortals`, `usePortalDetail`, `useCreatePortal`, `useDeletePortal`, `useLogVisit`. |
| `useSpatialSearch` | `hooks/useSpatialSearch.ts` | Nearby portal search with 30s cache and <100m movement threshold. |

---

## Seed Data

The seed script (`prisma/seed.ts`) creates a complete demo dataset for fresh deployments.

### Users (4)

| Email | Display Name | Password |
|-------|-------------|----------|
| alice@geoportal.com | Alice Chen | password123 |
| bob@geoportal.com | Bob Martinez | password123 |
| carol@geoportal.com | Carol Johnson | password123 |
| dave@geoportal.com | Dave Kim | password123 |

### Portals (23)

All 7 portal styles are represented. Portals span all 4 category sections.

**Portal section (10):**
- Central Park Gateway (entertainment, neon_ring) -- 342 visits
- Times Square Hologram (nightlife, holographic_frame) -- 512 visits
- Chelsea Tech Wormhole (tech, wormhole) -- 156 visits
- Williamsburg Food Portal (food, neon_ring) -- 278 visits
- Columbia University Hub (education, holographic_frame) -- 124 visits
- East Village Community Board (community, vortex_spiral) -- 87 visits
- SoHo Art Space Rift (art, space_rift) -- 98 visits
- Brooklyn Bridge Vortex (art, vortex_spiral) -- 189 visits
- Fifth Avenue Shopping District (shopping, wormhole) -- 267 visits
- Flatiron Coworking Space (business, holographic_frame) -- 98 visits

**Outdoor section (5):**
- Pelham Bay Fishing Spot (fishing, nebula_cloud) -- 67 visits
- Harriman State Park Trail Head (hiking, nebula_cloud) -- 134 visits
- Pine Barrens Campground (camping, plasma_gate) -- 56 visits
- Catskills ATV Trails (atv, space_rift) -- 78 visits
- Jones Beach Swimming (swimming, wormhole) -- 203 visits
- Central Park Foraging Walk (foraging, neon_ring) -- 34 visits

**For Sale section (5):**
- Brooklyn Brownstone Listing (houses, holographic_frame) -- 156 visits
- Jersey City Cars & Vehicles (cars, plasma_gate) -- 89 visits
- Hudson Valley Land Parcels (land, nebula_cloud) -- 45 visits
- LES Furniture Exchange (furniture, vortex_spiral) -- 67 visits
- Flushing Electronics Market (electronics, space_rift) -- 112 visits

**Other section (1):**
- Queens Village Garage Sales (garage_sales, plasma_gate) -- 43 visits

**Private/Hidden (1):**
- Alice Private Test Portal (other, neon_ring) -- private, hidden, 3 visits

### Related Data
- **220 portal visits** -- distributed across all public portals (up to 10 visit records each)
- **21 chat messages** -- across the first 5 portals, from all 4 users
- **58 reactions** -- across the first 10 portals, using emoji types: fire, purple_heart, sparkles, alien, cyclone, zap

### Locations
All portals are in the **NYC metro area** (lat ~40.5-42.1, lng ~-74.6 to -73.5) for easy spatial search testing. One outlier (Hudson Valley) is ~60 miles north.

### Running the seed
```bash
# Fresh seed (clears existing portals and related data first)
npx prisma db seed

# Or manually
npx ts-node prisma/seed.ts
```

The seed is **idempotent** -- users are upserted, and portal data is cleared and recreated on each run.

### Removing seed data

Once deployed and tested with real users, remove all seed data without affecting real user data:

```bash
npm run prisma:seed-delete
```

This identifies seed users by their `@geoportal.com` email domain and deletes in FK-safe order: reactions → messages → visits → portals → users. Real user data is never touched.

---

## Testing

64 tests across 11 test suites.

### Running tests

```bash
# Requires a test PostgreSQL database
# Start one with Docker:
docker run -d --name geoportal-test-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=geoportal_test \
  -p 5433:5432 \
  postgres:16-alpine

# Run migrations on test DB
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/geoportal_test npx prisma migrate dev

# Run all tests
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/geoportal_test \
JWT_SECRET=test-secret \
PORTAL_BASE_URL=http://localhost:3000 \
UPLOAD_DIR=./uploads_test \
npx jest --runInBand
```

### Test suites

| Suite | Tests | Coverage |
|-------|-------|----------|
| `api/auth` | 8 | Register, login, /me, duplicate email, invalid input, cookie handling |
| `api/portals-crud` | 12 | Create, list, filter by category, ownerId=me, detail, 404, owner-only update, owner-only delete, cascade delete |
| `api/spatial` | 4 | Nearby search, distance sorting, radius exclusion, query param coercion |
| `api/chat` | 5 | Authenticated send, 401 unauthed, empty rejection, chronological order, 10/min rate limit |
| `api/upload` | 6 | Valid JPEG upload, 401, oversized rejection, MIME rejection, magic byte mismatch, file serving |
| `api/visits` | 3 | Visit logging, totalVisits increment, rate limit, anonymous sessions |
| `api/qr` | 2 | SVG generation, 404 for missing portal |
| `api/rate-limiting` | 3 | Register 5/min, login 10/min |
| `auth` (unit) | 5 | JWT sign/verify, expiry, wrong secret, password hashing |
| `spatial` (unit) | 5 | Haversine distance, same point, cross-country, equator, bounding box |
| `validation` (unit) | 11 | Zod schema accept/reject for register, createPortal, spatialSearch |

---

## Project Structure

```
geo-portal/
├── app/
│   ├── layout.tsx                    # Root layout (providers, nav)
│   ├── page.tsx                      # Home page
│   ├── error.tsx                     # Global error boundary
│   ├── globals.css                   # Tailwind import
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── portals/
│   │   ├── page.tsx                  # Explore feed
│   │   ├── map/page.tsx              # Full-screen map
│   │   ├── create/page.tsx           # Portal editor
│   │   └── [id]/page.tsx             # Portal detail
│   ├── my-portals/page.tsx           # Owned portals
│   ├── leaderboard/page.tsx
│   └── api/
│       ├── auth/{register,login,me,logout}/route.ts
│       ├── portals/route.ts          # GET list, POST create
│       ├── portals/nearby/route.ts   # GET spatial search
│       ├── portals/[id]/route.ts     # GET, PUT, DELETE
│       ├── portals/[id]/visits/route.ts
│       ├── portals/[id]/qr/route.ts
│       ├── portals/[id]/chat/route.ts
│       ├── upload/route.ts
│       └── files/[filename]/route.ts
├── components/
│   ├── layout/                       # Providers, Navbar, AuthGuard
│   ├── map/                          # LeafletMap, MapboxMap, MapProviderSelector
│   └── portals/                      # All portal UI components
├── hooks/                            # useAuth, usePortals, useSpatialSearch
├── lib/
│   ├── auth.ts                       # JWT + bcrypt + cookie helpers
│   ├── db.ts                         # Prisma client singleton
│   ├── errors.ts                     # Standard API error responses
│   ├── h3Spatial.ts                  # H3 hex grid utilities
│   ├── rateLimit.ts                  # In-memory sliding-window limiter
│   ├── socket.ts                     # Socket.io client singleton
│   ├── spatial.ts                    # Raw SQL haversine queries
│   └── validation.ts                 # Zod schemas + categories + styles
├── prisma/
│   ├── schema.prisma                 # 5 models, 2 enums, 4 indexes
│   ├── seed.ts                       # Comprehensive demo data
│   ├── seed-delete.ts                # Remove seed data (keeps real users)
│   └── migrations/
├── __tests__/
│   ├── helpers.ts                    # Test utilities
│   ├── auth.test.ts                  # Unit: JWT, bcrypt
│   ├── spatial.test.ts               # Unit: haversine
│   ├── validation.test.ts            # Unit: zod schemas
│   └── api/                          # Integration tests (8 files)
├── server.ts                         # Custom server (Next.js + Socket.io)
├── docker-compose.yml                # PostgreSQL container
├── .env.example                      # Environment variable template
├── package.json
├── tsconfig.json
└── next.config.js
```
