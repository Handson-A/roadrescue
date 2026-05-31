# RoadRescue - System Architecture

## Overview

RoadRescue is a real-time rescue coordination platform connecting drivers with nearby mechanics for roadside assistance. It utilizes AI diagnostics, live location tracking, and a mechanic bidding system.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (Next.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Driver UI    │  │ Mechanic UI  │  │  Admin UI    │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
└────────┼──────────────────┼──────────────────┼───────────────┘
         │                  │                  │
┌────────▼──────────────────▼──────────────────▼───────────────┐
│              API Layer (Next.js Route Handlers)               │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────┐     │
│  │ /api/requests │  │ /api/ai/*     │  │ /api/webhooks│    │
│  └───────┬───────┘  └───────┬───────┘  └──────┬───────┘     │
└────────┼──────────────────┼──────────────────┼───────────────┘
         │                  │                  │
┌────────▼──────────────────▼──────────────────▼───────────────┐
│            External Services Integration                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Supabase   │  │   OpenAI     │  │   Webhooks   │        │
│  │  (Auth, DB) │  │ (Diagnostics)│  │ (NRSA, Ins.) │        │
│  └─────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (React 18)
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Real-time**: Supabase Realtime Subscriptions
- **Maps**: Leaflet.js or Google Maps API

### Backend
- **Runtime**: Node.js (Next.js)
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT-4
- **Real-time DB**: Supabase Realtime
- **Webhooks**: Custom edge handlers

### Infrastructure
- **Hosting**: Vercel (recommended)
- **Database Hosting**: Supabase Cloud
- **CDN**: Vercel Edge Network

## Core Features

### 1. Authentication & Authorization
- Email/password authentication
- Role-based access control (Driver, Mechanic, Admin)
- JWT tokens for API authentication
- Middleware-based route protection

### 2. Rescue Request Lifecycle
```
PENDING → ASSIGNED → IN_PROGRESS → COMPLETED
                  ↓
              CANCELLED
```

### 3. Mechanic Matching
- Location-based search using PostGIS
- Distance calculation between driver and mechanics
- Mechanic bidding system
- Rating and verification system

### 4. AI Diagnostics
- OpenAI integration for vehicle issue analysis
- Real-time diagnostic API endpoint
- Multi-step diagnostic flow

### 5. Real-time Updates
- Live location tracking
- Status updates via Supabase Realtime
- Push notifications (future)
- WebSocket connections for live data

## Database Schema

See `db-schema.md` for detailed schema documentation.

Key tables:
- `profiles`: User account information
- `mechanic_profiles`: Extended mechanic data
- `rescue_requests`: Rescue request records
- `request_bids`: Mechanic bids on requests
- `notifications`: User notifications

## API Endpoints

See `api-reference.md` for complete API documentation.

Main endpoints:
- `POST /api/auth/login` - User authentication
- `POST /api/requests` - Create rescue request
- `POST /api/ai/diagnose` - Get AI diagnosis
- `POST /api/webhooks` - Receive third-party webhooks

## Security

- Row-level security (RLS) on all database tables
- JWT token-based authentication
- HTTPS-only communication
- Input validation and sanitization
- CORS configuration
- Rate limiting on API endpoints
- Admin role escalation only through verified admin portals

## User Interfaces

### Onboarding
- 3-step carousel introducing platform features
- Consent requirement before authentication
- Responsive mobile-first design
- Redirect to `/auth/login` after completion

### Authentication Pages
- Login form with email/password
- Register form with role selection (Driver/Mechanic only - no public admin registration)
- Role-based access control at form level
- Responsive auth layout with rotating tips/quotes

### Driver Dashboard
- Create rescue request with vehicle and issue details
- View active and past requests
- Track assigned mechanic location on map
- Chat with assigned mechanic
- Rate mechanic after completion
- View request history and statistics

### Mechanic Dashboard
- Receive alerts for nearby requests
- Browse and place bids on pending requests
- Accept approved bids
- Update job status (en route, arrived, completed)
- Track earnings and completed jobs
- Rate drivers after completion
- View service area configuration

### Admin Dashboard
- View platform statistics (total users, active requests, revenue)
- Monitor all requests and mechanics
- Manage user accounts and profiles
- Verify upcoming mechanic profiles
- Access secret admin escalation portal for user role promotion
- View system activity and logs

### Settings & Account Pages
- Update profile information
- Change password
- Manage service preferences (mechanics only)
- View payment history
- Privacy and notification settings

## Key Features Implemented

1. **User Authentication**: Email/password with Supabase Auth
2. **Role-Based Access**: Driver, Mechanic, Admin with RLS enforcement
3. **Request Management**: Full lifecycle from creation to completion
4. **Mechanic Bidding**: Real-time bid placement and acceptance
5. **AI Diagnostics**: OpenAI-powered vehicle issue analysis
6. **Real-time Updates**: Supabase Realtime WebSocket subscriptions
7. **Location Tracking**: Live mechanic location on request map
8. **Admin Escalation**: Secret portal for existing admins to promote users
9. **Onboarding Flow**: Introduction carousel before authentication
10. **Ratings & Reviews**: Driver-mechanic mutual rating system
11. **Notifications**: In-app notifications for key events
12. **Rate Limiting**: API request rate limiting and validation

## Features Deferred (Future Implementation)

- Email notifications (integration with SendGrid/Mailgun)
- Google Maps API for enhanced mapping features
- Two-factor authentication
- Push notifications (mobile)
- Payment processing integration
- Mobile app (React Native)
- Advanced analytics and reporting

## Deployment

1. **Local Development**: `npm run dev`
2. **Production Build**: `npm run build`
3. **Deploy Frontend**: Push to GitHub → Vercel auto-deploys
4. **Deploy Database**: Supabase handles all PostgreSQL operations
5. **Environment Secrets**: Store in Vercel Settings and Supabase Project Settings
3. **Database**: Supabase hosted PostgreSQL
4. **CI/CD**: GitHub Actions workflow

## Performance Considerations

- Server-side rendering for SEO
- Image optimization with Next.js Image
- Database indexing on frequently queried columns
- Caching strategies for static content
- Connection pooling for database
- Geospatial indexes for location queries

## Future Enhancements

- Push notifications for drivers and mechanics
- In-app messaging system
- Payment processing integration
- Insurance company APIs
- Mobile native apps
- Advanced analytics dashboard
- Machine learning for mechanic matching
