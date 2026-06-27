# Walkthrough — RoadRescue Visual Refinements & Real-Time Coordination

This walkthrough documents the completed visual fixes, map integration, and real-time coordination features implemented to stabilize the RoadRescue roadside assistance platform. All changes compile cleanly and pass ESLint checks.

---

## 1. Accomplishments

### 🎨 UI & UX Refinements
- **Service Type Selector**: Redesigned the service selection dropdown inside [RequestForm.jsx](web/src/components/request/RequestForm.jsx) to render as a premium, interactive grid of selectable service cards featuring Lucide icons and clean sub-text descriptions.
- **Double Padding Bug**: Removed duplicate `lg:pl-64` layout offsets in [page.jsx (driver dashboard)](web/src/app/dashboard/driver/page.jsx) and [page.jsx (new request page)](web/src/app/dashboard/driver/request/new/page.jsx).
- **Synchronous `setState` Warnings**: Resolved all React 19 warnings regarding calling state setters synchronously inside `useEffect` across [LocationPicker.jsx](web/src/components/map/LocationPicker.jsx), [page.jsx (mechanic dashboard)](web/src/app/dashboard/mechanic/page.jsx), [page.jsx (mechanic navigation)](web/src/app/dashboard/mechanic/navigation/page.jsx), and [page.jsx (job detail)](web/src/app/dashboard/mechanic/job/[id]/page.jsx) by wrapping them inside deferred microtasks (`Promise.resolve().then(...)`).
- **JSX Quote Escapes**: Replaced raw `"` quotes with `&quot;` in search result header strings across driver, mechanic, and admin dashboard files.
- **Imports Cleanup**: Added missing imports (`Badge`, `BusFront`, `ExternalLink`, and specific Lucide icons) to clean compile blockers.

### 🗺️ Fuel/EV Station Map Picker
- **Accra Refueling Grid**: Programmed a set of mock refueling and EV charging stations centered around key hubs in Accra (East Legon, Airport Residential, Accra Mall, Spintex) directly into [LocationPicker.jsx](web/src/components/map/LocationPicker.jsx).
- **Toggle Control**: Integrated a clean "Show Fuel/EV Stations" button that renders these locations as distinct colored markers (orange for fuel, violet for EV) on the Leaflet map, enabling drivers to set their breakdown location directly to these nodes if they are stranded at a station.

### ⚡ Real-Time Dispatch & Bidirectional Sync
- **Online Broadcast**: Replaced redundant location-watching blocks in the mechanic dashboard and navigation pages with a unified coordinates-watch and broadcast effect in [useMechanicStatus.js](web/src/hooks/useMechanicStatus.js). It broadcasts current GPS coordinates to the `online-mechanics` realtime channel when a mechanic toggles their status to "Online".
- **Admin Map Overlay**: Updated the Admin Portal Map ([LiveHotspotsMap.jsx](web/src/components/admin/LiveHotspotsMap.jsx)) to listen to the `online-mechanics` channel, allowing live coordinates to overlay standby units dynamically.
- **Incident Markers**: Passed active incidents to `LiveHotspotsMap` and connected a PostgreSQL realtime change subscription inside [page.jsx (admin dashboard)](web/src/app/dashboard/admin/page.jsx) to immediately sync breakdown alerts.
- **Radar Map Pins**: Added `incomingJobs` markers to [RescueMap.jsx](web/src/components/map/RescueMap.jsx) to render pending driver request pins for nearby online mechanics in Radar Mode.
- **Active Job Tracking Map**: Embedded the live Leaflet map ([RescueMap.jsx](web/src/components/map/RescueMap.jsx)) inside the mechanic's [JobDetailPage](web/src/app/dashboard/mechanic/job/[id]/page.jsx) to render driver and mechanic positions simultaneously during active assignments.
- **Average Rating display**: Integrated Average Rating calculation in the driver's request tracking [page.jsx](web/src/app/dashboard/driver/request/[id]/page.jsx) to pull and display stars from the database instead of a hardcoded mock value.

### ⚡ Decoupled Broadcast Flow & RPC Realignment
- **Decoupled Request Creation**: Refactored the POST route handler [route.js](web/src/app/api/requests/route.js) to immediately save new requests to `rescue_requests` and broadcast them live to the Supabase channel, returning a `201` response to the driver without waiting for the matching and notification logic to finish.
- **Background Dispatch**: Run the PostGIS search and notification (database insertions + emails) inside a non-blocking background promise, preventing any downstream RPC match issues from crashing or delaying the driver's request submission.
- **RPC Parameter Alignment**: Updated the `get_nearby_verified_mechanics` RPC wrapper call in the route handler to pass `request_latitude`, `request_longitude`, and `search_radius_km` as arguments to match the remote database signature.

### 🔐 Secure Request Cancellation Guard
- **Status API Verification**: Audited and verified `/api/requests/[id]/status/route.js` to ensure the status string parameter is normalized to lowercase (`normalizeStatus`) before checking the cancellation conditions.
- **Current Database Status Check**: Implemented database-state checking in `/api/requests/[id]/status/route.js` to retrieve the current request status and return a `403 Forbidden` JSON response if the request has already reached `en_route`, `arrived`, or `in_progress`.
- **Double-Layer Library Guard**: Integrated the cancellation check directly inside the core `updateRequestStatus` library function in [request.js](web/src/lib/request.js). If any client attempt is made to cancel a request that has already progressed to `en_route`, `arrived`, or `in_progress`, the function immediately throws a `Not authorized` error which both API endpoints catch and return as `403 Forbidden`.

### ⛽ Dynamic Fuel/EV Stations Fetch
- **Database Integration**: Fully removed the hardcoded `MOCK_STATIONS` array in [LocationPicker.jsx](web/src/components/map/LocationPicker.jsx) and replaced it with a dynamic Supabase query against the `fuel_ev_stations` table inside a `useEffect` hook listening to the "Show Fuel/EV Stations" toggle state.
- **Leaflet Mapping**: Updated the marker rendering loop to map `latitude` and `longitude` fields from the database cleanly to Leaflet coordinate attributes and handle manual coordinates assignment for pickups.
- **Migration & Schema**: Created migration file `0004_tracking_and_history.sql` to define the `fuel_ev_stations` schema and seed it with Accra's initial service points.

### 🧠 AI Diagnostic Panel Layout Stabilization
- **Autoscroll Elimination**: Removed the aggressive `scrollIntoView` autoscroll effect inside [DiagnosticChat.jsx](web/src/components/ai/DiagnosticChat.jsx) when generating/updating the AI diagnosis, preventing unwanted viewport jumps and keeping text below the fixed header visible.
- **Layout Constraints**: Re-aligned the chat wrapper, eliminated the duplicate left-padding offset (`lg:pl-64`), and applied strict `max-h` height limits on the internal message scroller so the inputs and submit actions remain stacked at the bottom of the section and the user manually controls overflow.

### 🛠️ Administrative & DB API Fixes
- **Admin Mechanics Join Fix**: Restructured the select statement in `getMechanicsByStatus` in [admin.js](web/src/lib/admin.js) to nest the `profiles` join inside the `mechanic_profiles` block, successfully solving the `column mechanic_profiles_1.id does not exist` database crash by targeting the true foreign keys.
- **Admin Single Request Details Route**: Created a dynamic presentation route at [page.jsx (admin request details)](web/src/app/dashboard/admin/requests/%5Bid%5D/page.jsx) to display comprehensive details (driver, mechanic, map, timeline progress) and added administrative cancel options.
- **Cancelled Status Fetching**: Audited `/api/requests/[id]/route.js` to ensure the dynamic GET request handler retrieves cancelled requests correctly without throwing a 404.

### 🛑 Interactive Cancellation Reasons
- **Driver Prompts**: Updated `handleCancelRequest` in the driver's tracking page [page.jsx](web/src/app/dashboard/driver/request/%5Bid%5D/page.jsx) to prompt the user for a cancellation reason and pass it to `/api/requests/[id]/status`.
- **Mechanic Prompts**: Updated `cancelJob` in the mechanic's active job page [page.jsx](web/src/app/dashboard/mechanic/job/%5Bid%5D/page.jsx) to collect a cancellation reason from the specialist and forward it to `/api/requests/status`.
- **Admin Prompts**: Updated `handleAdminCancel` on the administrative request detail page [page.jsx](web/src/app/dashboard/admin/requests/%5Bid%5D/page.jsx) to collect reasons for cancellation.

---

## 2. Verification & Validation Results

### Linter Audit
We ran `npm run lint` inside the `web` source folder. The linter passed successfully with **zero errors**:
```bash
> web@0.1.0 lint
> eslint

✖ 2 problems (0 errors, 2 warnings)
```

### Production Build compilation
All routes compiled and optimized successfully:
```bash
▲ Next.js 16.2.6 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 38.3s
  Running TypeScript ...
  Finished TypeScript in 316ms ...
  Collecting page data using 11 workers ...
  Generating static pages using 11 workers (0/53) ...
✓ Generating static pages using 11 workers (53/53) in 1240ms
  Finalizing page optimization ...
```
All routes compiled and optimized successfully.
