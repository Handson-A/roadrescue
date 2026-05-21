# RoadRescue

RoadRescue is a real-time roadside assistance platform that connects stranded drivers with nearby mechanics. It combines rescue request management, mechanic bidding, live location tracking, AI-assisted vehicle diagnostics, and role-based dashboards for drivers, mechanics, and administrators.

The project is designed around a simple workflow: a driver reports a problem, the system helps assess the issue, nearby mechanics receive the request, and the best mechanic is assigned or accepted through bidding. Status updates are pushed in real time so every user sees the current state of the request.

## Core Features

- Driver, mechanic, and admin authentication with role-based access.
- Rescue request lifecycle from submission to completion or cancellation.
- Mechanic bidding and assignment for pending requests.
- Live request and location updates through Supabase Realtime.
- AI diagnostic assistant for interpreting vehicle symptoms.
- Admin tools for user, mechanic, and request oversight.
- Persistent request history, notifications, and ratings.

## Tech Stack

- Frontend: Next.js, React, Tailwind CSS, Lucide icons
- Backend: Next.js route handlers and server actions
- Database: PostgreSQL on Supabase
- Auth and realtime: Supabase Auth and Supabase Realtime
- AI: OpenAI-powered diagnostic flow
- Maps and location: Google Maps integration

## Repository Structure

- `web/` - Next.js application with the UI, hooks, route handlers, and shared components.
- `supabase/` - SQL migrations, schema setup, RLS policies, and seed data.
- `docs/` - Design notes for architecture, API behavior, database schema, realtime flow, and state transitions.
- `.github/` - workflows for CI/CD.

## System Overview

1. A driver submits a rescue request with location, vehicle details, and issue description.
2. The AI diagnostic flow can suggest likely causes and urgency before a request is dispatched.
3. Nearby mechanics receive the request and may place bids or be assigned directly.
4. The selected mechanic updates status as they travel, arrive, and complete the job.
5. Drivers and mechanics receive live updates, notifications, and history records for the completed request.

## Request Lifecycle

The main rescue request states are:

`PENDING` -> `ASSIGNED` -> `IN_PROGRESS` -> `COMPLETED`

At any stage before completion, a request can move to `CANCELLED`.

## Getting Started

1. Install dependencies in the web app:

```bash
cd web
npm install
```

2. Configure environment variables for Supabase, OpenAI, and any map provider used by the app.

3. Run the development server:

```bash
npm run dev
```

4. Open `http://localhost:3000` in your browser.

## Development Notes

- Database structure, RLS rules, and seed data live under `supabase/migrations/`.
- Architectural details are documented in `docs/architecture.md`.
- The AI diagnostic flow is described in `docs/ai-diagnostic.md`.
- The request state machine and realtime event flow are documented in `docs/state-machine.md` and `docs/realtime-flow.md`.

## Goal

The goal of RoadRescue is to reduce response time during roadside emergencies by combining automation, live coordination, and human mechanic support in one workflow.
