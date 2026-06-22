# RoadRescue

RoadRescue is a real-time roadside assistance platform connecting stranded drivers with nearby mechanics. The platform automates rescue request dispatch, mechanic acceptance, live tracking, and AI-assisted diagnostics in one integrated system.

## Overview

**The Problem**: When drivers experience vehicle emergencies, finding help quickly is challenging. Existing solutions lack real-time coordination and mechanic verification.

**The Solution**: RoadRescue provides:
- Instant mechanic matching based on location and availability
- AI-powered vehicle diagnostics to assess issue severity
- Live tracking from request creation to job completion
- Direct mechanic acceptance (no bidding)
- Ratings and verification for trusted service

## Key Features

### For Drivers
*   **Request Creation**: Easily log a rescue request, select breakdown coordinates on an interactive map picker, and add vehicle parameters (make, model, year, plate).
*   **AI diagnostics**: Converse with an AI diagnostic assistant powered by Google Gemini 2.5 Flash to identify potential issues, severities, and receive safety protocols.
*   **Fuel/EV Finder**: Toggle active fuel stations and EV charging hubs dynamically fetched from the database to map breakdowns precisely to refueling points.
*   **Live Tracker**: Track the assigned mechanic's GPS movement in real-time as they proceed from `accepted` -> `en_route` -> `arrived` -> `in_progress` -> `completed`.
*   **Safety Evacuation**: Access hardcoded commute gateways (Uber, Yango, Bolt) directly from the UI for scene evacuation if the vehicle cannot be fixed immediately.
*   **Reviews**: Review and rate assigned mechanics on a 1-5 scale upon job completion.

### For Mechanics
*   **Radar Mode**: Toggle "Online" availability to broadcast GPS locations via WebSockets and view nearby breakdown pins.
*   **Direct Acceptance**: Claim pending nearby requests instantly with zero bidding overhead.
*   **Job Navigator**: Access driver vehicle cards and contact info, view paths, and update job progress logs.
*   **Account Settings**: Manage experience levels, business details, specializations, base hourly rates, and service radius limits.

### For Administrators
*   **Operations Console**: Monitor active incidents, verify mechanics, manage change requests, and escalate profile fields.
*   **Realtime Incident Map**: View active coordinate overlays of all standby mechanics and incidents.
*   **Cascade Cleanups**: Suspend bad-actor accounts with safe cascades to prevent data anomalies.

---

## Request Lifecycle State Machine

Rescue requests follow a strict transaction-enforced state flow:

```text
pending ──> offered ──> accepted ──> en_route ──> arrived ──> in_progress ──> completed
   │                       │
   └───[cancelled] <───────┘
```

*   **Cancellation Policy**: Drivers and mechanics can cancel requests only during `pending` or `accepted` states. If the request progresses to `en_route`, `arrived`, or `in_progress`, cancellation is disabled at both the API and database levels, returning a `403 Forbidden` response.
*   **Concurrence Protection**: Optimistic updates ensure no two mechanics can accept the same request simultaneously.

---

## Tech Stack

*   **Frontend**: Next.js 16 (App Router, React 19, React Compiler), Tailwind CSS v4, Framer Motion, Leaflet Maps
*   **Backend**: Next.js Route Handlers, Node.js, RBAC guards
*   **Database**: Supabase PostgreSQL with PostGIS geographic operators, RLS, and Realtime WebSocket broadcast channels
*   **AI Engine**: Google Gemini 2.5 Flash API with strict JSON schema validation
*   **Emails**: Resend API
*   **Deployment**: Vercel (Web Application), Supabase Cloud (Database)

---

## Getting Started

### Installation
1. Clone and install dependencies inside the `web` workspace:
   ```bash
   cd roadrescue/web
   npm install
   ```

2. Create a `.env.local` file inside `web/` using this template:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   RESEND_API_KEY=your_resend_api_key
   ```

3. Run the Next.js development server:
   ```bash
   npm run dev
   ```

4. Apply the database schemas sequentially by running the scripts in `supabase/migrations/` using your Supabase SQL Editor.

---

## Documentation

Comprehensive project documentation is available inside the `docs/` folder:
*   [Component Architecture](docs/architecture.md)
*   [API Endpoint Reference](docs/api-reference.md)
*   [Database Schema Specs](docs/db-schema.md)
*   [Real-time WebSocket Flow](docs/realtime-flow.md)
*   [Row-Level Security Policies](docs/rls-policies.md)
*   [AI Diagnostic Operations](docs/ai-diagnostic.md)
*   [System Technical Briefcase](TECHNICAL_BRIEFCASE.md)

---

RoadRescue © 2026. All rights reserved.