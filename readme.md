# RoadRescue

RoadRescue is a real-time roadside assistance platform connecting stranded drivers with nearby mechanics. The platform automates rescue request dispatch, mechanic bidding, live tracking, and AI-assisted diagnostics in one integrated system.

## Overview

**The Problem**: When drivers experience vehicle emergencies, finding help quickly is challenging. Existing solutions lack real-time coordination and mechanic verification.

**The Solution**: RoadRescue provides:
- Instant mechanic matching based on location and availability
- AI-powered vehicle diagnostics to assess issue severity
- Live tracking from request creation to job completion
- Transparent bidding system ensuring fair pricing
- Ratings and verification for trusted service

## Key Features

### For Drivers
- Create rescue requests with vehicle details and issue description
- Receive AI diagnostics to understand the problem
- View nearby mechanic bids and choose the best option
- Real-time tracking of assigned mechanic's location
- Rate mechanics and save preferred ones

### For Mechanics
- Receive alerts for rescue requests in their service area
- Place competitive bids on requests
- Real-time job location and driver contact info
- Live job progress tracking (en route, arrived, completed)
- Build reputation through ratings and completed jobs

### For Administrators
- Monitor all platform activity and requests
- Verify and manage mechanic profiles
- Escalate user roles (create new admins)
- View platform statistics and performance metrics
- Handle disputes and user support

## Platform Architecture

The system consists of three main layers:

1. **Frontend** (Next.js + React)
   - Responsive UI for web clients
   - Role-based dashboards (driver, mechanic, admin)
   - Real-time updates via WebSocket subscriptions
   - AI diagnostic chat interface

2. **Backend** (Next.js API Routes)
   - RESTful API for all operations
   - Request validation and error handling
   - Integration with OpenAI for diagnostics
   - Webhook handling for external services

3. **Database** (PostgreSQL on Supabase)
   - 5 core tables: profiles, mechanic_profiles, rescue_requests, request_bids, notifications
   - Row-level security for data privacy
   - Real-time subscriptions for live updates

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 18, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Next.js Route Handlers |
| **Database** | PostgreSQL, Supabase Auth & Realtime |
| **AI** | OpenAI GPT-4 for vehicle diagnostics |
| **Deployment** | Vercel (frontend), Supabase Cloud (database) |

## Request Lifecycle

Every rescue request follows this state machine:

```
PENDING → (mechanic bid accepted) 
   ↓
ASSIGNED → (mechanic confirms arrival) 
   ↓
IN_PROGRESS → (service completed)
   ↓
COMPLETED (driver/mechanic rate each other)

Optional: CANCELLED (at any stage before completion)
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. **Clone and install dependencies**
   ```bash
   cd roadrescue/web
   npm install
   ```

2. **Configure environment variables**
   Create `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   OPENAI_API_KEY=your_openai_key
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`

4. **Set up database** (first time only)
   - Run Supabase migrations in `supabase/migrations/`
   - Seed test data: `20260521000008_seed_data.sql`

## Documentation

- **[Architecture](docs/architecture.md)** - System design and component relationships
- **[API Reference](docs/api-reference.md)** - Complete endpoint documentation
- **[Database Schema](docs/db-schema.md)** - Table structures and relationships
- **[State Machine](docs/state-machine.md)** - Request lifecycle and transitions
- **[Real-time Flow](docs/realtime-flow.md)** - WebSocket events and subscriptions
- **[RLS Policies](docs/rls-policies.md)** - Row-level security rules
- **[AI Diagnostics](docs/ai-diagnostic.md)** - Vehicle diagnostic flow

## Project Structure

```
roadrescue/
├── web/                    # Next.js application
│   ├── src/
│   │   ├── app/           # Route handlers and pages
│   │   ├── components/    # React components (auth, map, request, admin)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities, API clients, constants
│   │   ├── providers/     # Context providers (Auth, Toast)
│   │   └── styles/        # Global CSS
│   └── package.json
├── supabase/              # Database setup
│   └── migrations/        # SQL migrations (schema, RLS, seed)
├── docs/                  # Architecture and API documentation
└── .github/               # CI/CD workflows
```

## User Roles & Data Access

| Role | Can See | Can Do |
|------|---------|--------|
| **Driver** | Own requests, mechanic profiles, assigned mechanic details | Create requests, bid reviews, rate mechanics |
| **Mechanic** | Profitable requests, assigned jobs, driver location during job | Submit bids, accept jobs, update status, track earnings |
| **Admin** | All users, all requests, all bids, platform stats | Approve/reject mechanics, escalate roles, resolve disputes |

## Status & Roadmap

### ✅ Completed
- User authentication and authorization
- All three role-based dashboards
- Request creation and full lifecycle management
- Mechanic bidding system
- AI vehicle diagnostics
- Real-time location tracking and updates
- Admin user management and escalation
- Onboarding flow
- Rate limiting and request validation
- Error handling and user feedback

### 🚧 In Progress / Planned
- Email notifications for key events
- Payment processing and earnings reports
- Two-factor authentication
- Mobile app (React Native)
- Advanced routing optimization
- Machine learning for mechanic matching

## Testing

- Manual testing possible via development server at `localhost:3000`
- Test credentials available in seed data
- Admin portal at `/dashboard/admin` (requires admin role)

## Deployment

1. **Frontend**: Push to GitHub → Vercel auto-deploys
2. **Database**: Supabase handles PostgreSQL automatically
3. **Environment secrets**: Store in Vercel and Supabase project settings

See [Architecture docs](docs/architecture.md) for deployment details.

## Support

For questions or issues, refer to:
- API documentation in `docs/api-reference.md`
- Database schema in `docs/db-schema.md`
- State machine in `docs/state-machine.md`

## License

RoadRescue © 2026. All rights reserved.


<!-- Redesign and restructure the mobile PWA navigation and UI architecture for the RoadRescue application while STRICTLY maintaining the provided color palette and visual identity from the attached design reference.

## Primary Goal

Create a modern emergency-response mobile UX optimized for:

* fast roadside interactions
* thumb-friendly navigation
* clarity under stress
* clean PWA responsiveness
* role-based navigation

The desktop version can keep the full sidebar with all routes, but the mobile version must use a simplified bottom navigation architecture.

---

# Mobile Bottom Navigation Structure

Implement a 5-tab bottom navigation for mobile ONLY.

## Tabs

### 1. Home

Purpose:

* Main dashboard
* Quick overview
* Fast access to emergency actions

Include:

* Active request summary
* Nearby mechanics snapshot
* AI diagnostic shortcut
* Vehicle overview
* Safety tips
* Recent activity

Suggested icon:

* Home

---

### 2. Rescue

Purpose:
Core roadside emergency coordination.

Include:

* Request roadside assistance
* Tow requests
* Mechanic matching
* Live tracking
* Emergency status
* ETA updates
* Incident reporting

This tab should feel operational and high priority.

Suggested icon:

* Wrench / SOS / Alert

---

### 3. AI Assist

Purpose:
AI-assisted diagnostics experience.

Include:

* Symptom chat input
* AI diagnostics
* Tow vs repair recommendation
* Urgency assessment
* Repair suggestions
* Vehicle issue history

Suggested icon:

* Sparkles / Bot / Brain

---

### 4. Activity

Purpose:
Operational history and communication.

Include:

* Notifications
* Messages/chat
* Request history
* Completed jobs
* Reviews
* Saved mechanics

Suggested icon:

* Bell / Activity / Inbox

---

### 5. Profile

Purpose:
User management and settings.

Include:

* User profile
* Vehicles
* Verification
* Security settings
* Help/support
* Logout

Suggested icon:

* User / Shield

---

# Floating Emergency Action Button (IMPORTANT)

Add a persistent floating action button (FAB) on mobile:

* visible across primary screens
* emergency-focused
* opens “Request Rescue”
* should stand out visually
* positioned bottom-right or centered above nav

Label examples:

* SOS
* Request Help
* Rescue

---

# Role-Based Navigation

The navigation should adapt based on user role.

## Driver Navigation

* Home
* Rescue
* AI Assist
* Activity
* Profile

## Mechanic Navigation

Replace driver-focused screens with:

* Jobs
* Requests
* Navigation
* Activity
* Profile
also it can have a desktop version too with detailed navlinks on the sidebar
## Admin

Do NOT use bottom navigation heavily.
Use a dashboard/sidebar layout instead.

---

# STRICT DESIGN SYSTEM REQUIREMENTS

Use ONLY the following colors from the provided palette.

## Primary Color

#FFD700

Use for:

* active states
* primary buttons
* FAB
* highlights
* active nav item
* loading accents

---

## Secondary Color

#111827

Use for:

* backgrounds
* dark sections
* nav bars
* cards
* typography emphasis

---

## Tertiary Color

#F3F4F6

Use for:

* light surfaces
* cards
* section backgrounds
* inputs

---

## Neutral Color

#7C7767

Use for:

* secondary text
* borders
* muted states
* placeholders

---

# Visual Style Requirements

Maintain:

* soft rounded corners
* modern minimal layout
* premium emergency-tech feel
* clean spacing
* subtle shadows
* uncluttered interfaces

Typography:

* clean sans-serif
* strong hierarchy
* large readable emergency actions

---

# Mobile UX Requirements

Optimize for:

* one-handed use
* accessibility
* fast emergency interactions
* low cognitive load
* responsive PWA behavior

Ensure:

* bottom nav remains fixed
* FAB does not overlap important content
* smooth transitions
* mobile-first responsiveness

---

# Technical Requirements

If using React/Next.js:

* use responsive conditional rendering
* mobile bottom nav only on small screens
* desktop retains sidebar
* support dark/light surfaces using the defined palette only

Structure the navigation cleanly for scalability and future integrations.

Avoid overcrowding the bottom nav with too many routes.

Use nested routes/screens for secondary features instead of adding more tabs.

---

# Final Instruction

The redesign should feel like:
“Uber + roadside emergency platform + AI assistant”

Prioritize:

* clarity
* speed
* trust
* professionalism
* emergency usability

Stick STRICTLY to the provided color palette and aesthetic direction from the attached image.

once the role === mechanic, where on large screen or desktop, the sos shouldnt exist. 
 -->