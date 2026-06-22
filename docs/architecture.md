# RoadRescue - System Architecture

## Overview

RoadRescue is a real-time roadside assistance platform connecting drivers with nearby verified mechanics. The system uses direct mechanic acceptance, strict server-side lifecycle transitions, live location updates, and AI-assisted diagnostics.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (Next.js)                     │
│  Driver UI        Mechanic UI        Admin UI                │
└────────┬──────────────────┬──────────────────┬───────────────┘
         │                  │                  │
┌────────▼──────────────────▼──────────────────▼───────────────┐
│              API Layer (Next.js Route Handlers)               │
│  /api/requests   /api/ai/diagnose   /api/admin/*             │
│  /api/profile/*  /api/notifications /api/webhooks            │
└────────┬──────────────────┬──────────────────┬───────────────┘
         │                  │                  │
┌────────▼──────────────────▼──────────────────▼───────────────┐
│            External Services Integration                       │
│  Supabase (Auth, DB, Realtime) | Gemini AI | Email provider   │
└───────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- Next.js App Router
- React Server and Client Components
- Tailwind CSS
- Leaflet maps
- Supabase client for authenticated reads and realtime subscriptions

### Backend
- Next.js Route Handlers
- Supabase Auth for user sessions
- PostgreSQL with PostGIS for geospatial matching
- Service role client for server-side writes and notifications
- Gemini API for AI diagnostic responses

### Infrastructure
- Vercel for the Next.js app
- Supabase Cloud for PostgreSQL, Auth, Storage, and Realtime

## Core Features

### Authentication and Authorization
- Driver, mechanic, and admin roles
- Role-aware dashboards
- Server-side authorization checks for sensitive mutations

### Rescue Request Lifecycle

```
pending → accepted → en_route → arrived → in_progress → completed
```

Cancellation is allowed from:

```
pending, accepted, en_route, arrived, in_progress
```

All status changes go through `PATCH /api/requests/status`. Mechanics cannot update `rescue_requests` directly from the browser.

### Mechanic Matching
- PostGIS distance search through `get_nearby_verified_mechanics` RPC function
- Only verified (`verification_status = 'approved'`) and available mechanics are returned
- Drivers are notified when nearby mechanics are found

### AI Diagnostics
- Client chat posts to `/api/ai/diagnose`
- Server route calls Gemini and returns a concise reply
- Request form can store structured diagnostic output on `rescue_requests.ai_diagnostic_result`

### Real-time Updates
- Mechanic location updates
- Request status changes
- Notifications and messages

## Database Schema

Key tables:

- `profiles`: user account information for all roles
- `mechanic_profiles`: mechanic verification, availability, location, and ratings
- `driver_profiles`: driver vehicle details and preferences
- `rescue_requests`: rescue lifecycle records
- `notifications`: user notifications
- `messages`: request chat messages
- `profile_preferences`: user-specific preferences
- `profile_change_requests`: admin-reviewed profile updates

## API Endpoints

See `api-reference.md` for details.

Main endpoints:

- `POST /api/requests` - create rescue request
- `GET /api/requests/:id` - request details
- `PATCH /api/requests/status` - lifecycle transitions
- `GET/POST /api/requests/:id/messages` - request chat
- `PATCH /api/requests/rate` - driver rating
- `POST /api/ai/diagnose` - AI diagnostic reply
- `GET/PATCH /api/admin/*` - admin operations
- `GET/PATCH /api/profile/*` - profile preferences and change requests
- `POST /api/notifications/email` - email notification relay
- `POST /api/webhooks` - third-party webhooks

## User Interfaces

### Driver Dashboard
- Create rescue requests
- Track active and past requests
- Chat with assigned mechanic
- Rate completed jobs

### Mechanic Dashboard
- Accept nearby requests through lifecycle API
- Update status through the same lifecycle API
- Cancel assigned requests through the lifecycle API
- Manage availability and profile details

### Admin Dashboard
- View platform statistics
- Monitor requests, users, and mechanic verification
- Review profile change requests
- Escalate trusted users to admin

## Key Features Implemented

1. Role-based authentication with RBAC component protection
2. Request creation and geospatial mechanic matching
3. Server-side lifecycle transition validation
4. Mechanic acceptance without bidding
5. Mechanic approval lifecycle with `blocked_emails` blocking
6. AI diagnostic chat (Google Gemini)
7. Real-time mechanic location tracking
8. Admin user and profile management
9. In-app notifications
10. Request chat
11. Driver ratings

## Features Deferred

- Payments and earnings settlement
- Push notifications
- Native mobile apps
- Advanced route optimization
- Insurance integrations
