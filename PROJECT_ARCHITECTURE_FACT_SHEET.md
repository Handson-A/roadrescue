# RoadRescue — Project Architecture and Security Fact Sheet

> **Optimized for NotebookLM Ingestion**
> Last updated: 2026-06-15

---

## 1. Executive Summary & Problem Statement

**RoadRescue** is a real-time roadside assistance platform that connects stranded vehicle drivers with nearby verified mechanics. It is a full-stack web application designed to reduce the friction, uncertainty, and delay typically associated with vehicle breakdowns.

**Problem Solved:**
When a vehicle breaks down, drivers face a fragmented, slow, and untrusted ecosystem of recovery options. Existing solutions rely on phone calls, uncertain response times, and unverified service providers. RoadRescue replaces this with a geospatially intelligent, real-time dispatch system that:
- Matches drivers with the nearest **verified** mechanic within seconds
- Provides live mechanic location tracking for situational awareness
- Offers AI-powered vehicle diagnostics to help drivers understand issues before help arrives
- Enforces strict request lifecycle management so no request falls through the cracks
- Maintains platform integrity through admin oversight and mechanic verification workflows

**Target Users:**
- **Drivers** — primary beneficiaries stranded needing immediate assistance
- **Verified Mechanics** — service providers who accept and fulfill rescue requests
- **Platform Administrators** — oversight, verification, dispute resolution, and user management

---

## 2. Core Feature Set

### A. Rescue Request Lifecycle Engine
- Drivers create structured rescue requests with vehicle details, incident location (via map picker), and optional symptom descriptions
- Requests follow a strict state machine: `pending → accepted → en_route → arrived → in_progress → completed` (or `cancelled`)
- Mechanic auto-matching via PostGIS geospatial query (default 10 km radius, visible to verified mechanics only)
- Status transitions are enforced server-side; invalid moves (e.g., pending → completed) are rejected
- Optimistic concurrency control prevents stale-write conflicts during rapid status changes

### B. Real-Time Mechanic Location Tracking
- Active mechanics broadcast GPS coordinates every 15 seconds
- Locations are persisted to a time-series table every 60 seconds for historical reference
- Drivers see live mechanic markers on an interactive map via Supabase Realtime WebSocket subscriptions
- RLS policies ensure only the assigned driver (and admins) can view a mechanic's location

### C. AI-Powered Vehicle Diagnostics
- Drivers describe symptoms via a conversational chat interface
- Backend calls **Google Gemini 2.5 Flash** with a structured JSON response schema
- Returns normalized diagnosis: problem identification, severity level, recommended actions, and estimated causes
- Exponential-backoff retry (up to 3 attempts) handles transient 503 errors
- Rate-limited to 5 requests/minute to control AI cost exposure
- Diagnostic results can be attached to the associated rescue request record

### D. Mechanic Verification & Admin Console
- Mechanics submit verification documents; admins approve or reject with audit logging
- Admin dashboard provides platform statistics, user management, request monitoring, and mechanic oversight
- Admins can suspend users via service-role deletion with full cascade cleanup
- Profile change requests require admin review before mutation, preventing unauthorized profile edits

### E. In-App Communication
- Structured chat between driver and assigned mechanic scoped to a specific rescue request
- Participants: driver, assigned mechanic, and platform admin
- Message delivery is real-time via Supabase Realtime

### F. Notification & Email Layer
- In-app notifications are user-scoped and delivered via real-time subscriptions
- Transactional emails (Resend) for key lifecycle events: request creation, mechanic acceptance, status changes, cancellations
- Email sending is non-blocking and best-effort (fire-and-forget)

### G. Driver Ratings & Reviews
- Drivers rate completed jobs on a structured scale
- Mechanic average ratings are recalculated on each new rating submission
- Ratings are visible to future drivers during mechanic selection

### H. Emergency Contact (SOS) Integration
- Drivers can link an emergency contact to their profile
- SOS actions trigger emergency contact notification (implementation-dependent)

---

## 3. Technical Stack & Implementation

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 16** (App Router, React 19, React Compiler enabled) |
| Styling | **Tailwind CSS v4** with custom design tokens (gold/amber primary `#F5D108`, warm cream backgrounds) |
| Maps | **Leaflet** (react-leaflet) + **Mapbox GL** (react-map-gl), OpenStreetMap tiles, Nominatim geocoding |
| Animations | **Framer Motion** |
| Notifications | **React Hot Toast** |
| Icons | **Lucide React** |

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Next.js Route Handlers (App Router) — no separate backend server |
| Database | **PostgreSQL** (Supabase Cloud) with **PostGIS** extension |
| Auth | **Supabase Auth** (JWT-based, email/password) |
| Realtime | **Supabase Realtime** (WebSocket subscriptions) |
| AI | **Google Gemini 2.5 Flash** (`@google/genai`) |
| Email | **Resend** (`resend` SDK) |

### State Management
- **Zustand v5** for global auth state (`user`, `profile`, `networkStatus`, `error`)
- **AuthProvider** wraps application; listens to `onAuthStateChange` and syncs Zustand store
- Custom React hooks encapsulate domain logic: `useAuth`, `useRealtime`, `useMechanicLocation`, `useDiagnostic`, `useNotifications`, `useRequest`, `useIncomingJobs`, `useRequestStatus`
- No external data-fetching library (React Query / SWR); direct Supabase client calls throughout

### Database Architecture
- Single Supabase PostgreSQL instance with PostGIS for geospatial queries
- Core schema: `profiles`, `driver_profiles`, `mechanic_profiles`, `admin_profiles`, `rescue_requests`, `mechanic_locations`, `notifications`, `messages`, `mechanic_verifications`, `request_status_history`
- Custom stored procedure: `get_nearby_verified_mechanics` — PostGIS distance query with availability and verification filtering
- Database triggers auto-create role-specific sub-profiles on auth user creation and log status changes

### Deployment
| Environment | Service | Configuration |
|-------------|---------|---------------|
| Application | **Vercel** | Root directory: `web/`, framework: `nextjs`, 60s timeout for API functions |
| Database + Auth | **Supabase Cloud** | PostgreSQL + PostGIS, RLS enabled on all tables |
| CI/CD | **GitHub Actions** | Node 20, `npm ci → npm test → npm run build` on push/PR to `main` or `dev` |

---

## 4. Security-by-Design Architecture

### A. Authentication Foundation
- **Supabase Auth** manages identity with JWT sessions stored in HTTP-only cookies (`@supabase/ssr`)
- Session validation occurs on every request via `auth.getUser()` — no client-side trust assumptions
- Registration flow captures `role`, `full_name`, and `phone` in `raw_user_meta_data`
- PostgreSQL trigger `handle_new_auth_user` atomically creates the `profiles` row and the matching role-specific sub-profile upon auth user creation
- Network resilience: exponential backoff retry (3 attempts, 1s→2s→4s delay) on auth failures with graceful degradation to `raw_user_meta_data` if profile fetch is blocked by RLS

### B. Multi-Layer Authorization (Defense in Depth)
| Layer | Mechanism | Enforcement Point |
|-------|-----------|-------------------|
| Infrastructure | **Next.js Proxy (Middleware)** | `proxy.js` — intercepts `/dashboard/*` and `/auth/*`, redirects unauthenticated users and role-mismatched users |
| API | **Route Guards** (`lib/rbac.js`) | Every API route calls `protectApiRoute()` or `requireAdmin/Mechanic/Driver()` before processing |
| Database | **Row Level Security (RLS)** | All tables have granular RLS policies; Supabase enforces them at the storage engine level |
| Client | **UI Guards** (`RoleGuard`, `RBACProtected`) | Conditional rendering prevents unauthorized UI elements from appearing |
| Business Logic | **Server-side Validation** | State machine transitions, resource ownership checks, input bounds validation |

### C. Row Level Security Policies
- **rescue_requests**: Drivers see own requests; mechanics see assigned requests; admins see all; pending requests visible to all verified mechanics (enabling discovery)
- **profiles**: Users can update own profile; admins have full CRUD; authenticated users can read
- **mechanic_profiles**: Readable by all authenticated users; pending mechanics hidden from driver-facing discovery (filtered by `verification_status`)
- **notifications**: Strictly user-scoped — a user can only read their own notifications
- **messages**: Restricted to request participants (driver + assigned mechanic + admin)
- **mechanic_locations**: Mechanics insert own; admins + assigned driver read
- **mechanic_verifications**: Admins issue mutations only; no user-level delete on profiles (preserves audit trail)

### D. API-Level Security Controls
- **RBAC Guards**: `protectApiRoute('driver,mechanic,admin')`, `requireAdmin()`, `requireMechanic()`, `requireDriver()`
- **Resource Ownership**: Drivers can only rate their own completed requests; admins get elevated access
- **State Machine Enforcement**: All status changes must route through `PATCH /api/requests/status` with `isValidTransition()` validation server-side — the client cannot bypass this
- **Optimistic Concurrency**: Updates include `.eq('status', request.status)` to prevent stale-write overwrites
- **Input Validation**: Latitude/longitude bounds, service type enum validation, vehicle year range, description length limits validated server-side before DB writes

### E. Rate Limiting & Cost Protection
- **AI Diagnostics**: 5 requests/minute per user/IP (in-memory tracker) — controls expensive LLM costs
- **Request Creation**: 3 requests/minute — prevents spam and abuse
- **General API**: 30 requests/minute
- *Note: Current in-memory implementation is suitable for single-instance Vercel deployments; multi-instance or production-scale deployments should upgrade to Redis/Upstash*

### F. Secret Management & Environment Security
- Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `RESEND_API_KEY`) carry **no** `NEXT_PUBLIC_` prefix — never exposed to the browser
- `.env.local` is gitignored; `.env.example` documents required variables without exposing values
- Vercel environment scoping: service role, AI, and email keys are set to **Production only** (not Preview/Development)
- Vercel security headers enforced at the edge: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`

### G. Admin Safeguards
- Admin routes use double-verification: `requireAdmin()` plus inline `profile.role !== 'admin'` check
- User suspension uses `auth.admin.deleteUser()` (service role) with cascading cleanup of related data
- All admin actions are audit-logged via `request_status_history` trigger

---

## 5. Critical User Flows

### Flow: Driver Creates a Rescue Request to Resolution

**Phase 1: Request Creation**
1. Driver navigates to `/dashboard/driver/request/new`
2. Fills structured form: vehicle details (make, model, year, license plate), incident description, and selects incident location via interactive map picker (Leaflet + Nominatim reverse geocoding)
3. Optionally describes symptoms for AI diagnostic pre-assessment
4. Client validates input bounds; submits `POST /api/requests`

**Phase 2: Server Processing**
5. API route `protectApiRoute('driver')` validates session and role
6. Input validation runs (lat/lng bounds, service type enum, year range)
7. Inserts `rescue_requests` row with `status = 'pending'` and PostGIS `ST_SetSRID(ST_MakePoint(lng, lat), 4326)` point
8. Calls stored procedure `get_nearby_verified_mechanics(lat, lng, radius)` — PostGIS `ST_DWithin` query returns mechanics within 10 km with `is_available = true` and `verification_status = 'approved'`
9. Creates `notification` rows for each matched mechanic (service role bypasses RLS)
10. Sends email notifications to matched mechanics (best-effort, non-blocking via Resend)
11. Returns request object to client; Supabase Realtime broadcast notifies subscribed mechanics of new pending request

**Phase 3: Mechanic Discovery & Acceptance**
12. Subscribed mechanics receive real-time update of new pending request in their dashboard
13. Mechanic reviews request details (vehicle info, location, description) and clicks "Accept"
14. Client sends `PATCH /api/requests/status` with `{ requestId, newStatus: 'accepted' }`
15. Server validates: authenticated as mechanic, request is `pending`, not already assigned
16. Executes optimistic update: `UPDATE rescue_requests SET status = 'accepted', mechanic_id = ?, accepted_at = NOW() WHERE id = ? AND status = 'pending' AND mechanic_id IS NULL`
17. Sets `mechanic_profiles.is_available = false` for the accepting mechanic
18. Creates driver notification ("mechanic accepted") and sends email to driver
19. Realtime subscription pushes updated request to all subscribers

**Phase 4: Mechanic En Route**
20. Mechanic updates status to `en_route` via same `PATCH /api/requests/status` endpoint
21. Server validates transition (`accepted → en_route` is valid per state machine)
22. Realtime broadcast triggers driver's map to show mechanic marker with live location updates

**Phase 5: Live Location Tracking**
23. Mechanic's device broadcasts GPS position every 15 seconds via `PATCH /api/mechanic/location`
24. Location persisted to `mechanic_locations` (timeseries) every 60 seconds
25. Driver's map component (react-map-gl / Leaflet) receives WebSocket updates via `useRealtime` hook subscribed to `mechanic_profiles:UPDATE` filtered by `assigned_mechanic_id`
26. RLS ensures driver reads only their assigned mechanic's location; mechanic sees only their own

**Phase 6: Arrival & In Progress**
27. Mechanic updates status to `arrived`, then to `in_progress`
28. Each transition is validated server-side and broadcast via Realtime
29. Driver and mechanic can communicate via in-app chat (scoped to `rescue_request_id`)

**Phase 7: Completion & Rating**
30. Mechanic marks request `completed`
31. Server calculates final timestamps, updates `mechanic_profiles` if needed
32. Driver receives notification and is prompted to rate the mechanic (1–5 scale + review text)
33. `PATCH /api/requests/rate` validates driver owns the request and it is completed
34. Mechanic's average rating is recalculated and persisted
35. Request lifecycle is archived; all participants can view final status and history

**Key Security Boundaries Enforced During Flow:**
- Driver cannot create requests for other users
- Mechanic cannot accept a request already assigned to another mechanic (optimistic concurrency prevents race conditions)
- Status transitions are enforced server-side (client cannot skip states)
- Location visibility is bounded by RLS: driver sees only assigned mechanic; mechanic cannot see other mechanics' locations
- All notifications and messages are user-scoped to prevent cross-user data leakage
- Service role key is never used client-side; all privileged DB operations happen in API routes with RBAC pre-checks

---

*End of Fact Sheet*
