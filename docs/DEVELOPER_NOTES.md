# Developer Notes — Recent Changes (summary)

This file documents recent implementation and behavior changes that affect development, testing, and deployment.

Auth & Profiles
- `AuthProvider` merges role-specific tables (`driver_profiles`, `mechanic_profiles`) into the main `profile` object. This flattens vehicle and mechanic-specific fields so UI components can read `profile.vehicle_make`, `profile.total_earnings`, etc.
- The app will use a local mock Supabase client when either `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are absent, or when `NEXT_PUBLIC_USE_MOCK_AUTH=true`.

Mechanic Approval Lifecycle
- `updateRequestStatus()` validates `mechanic_profiles.verification_status === 'approved'` before allowing acceptance
- Admin rejection inserts email into `blocked_emails` table and deletes auth user
- Rejected mechanics cannot sign up again due to trigger on `blocked_emails`

Routing & UX
- Login/Register flows require DB-backed role before auto-routing into role dashboards
- Sign-out: uses client-side navigation (`router.replace('/auth/login')` after `signOut()`

Mechanic Dashboard
- The `Earnings` entry was removed from the mechanic sidebar; earnings are now displayed inside the mechanic Account page as a dedicated earnings card. Edit actions were added to profile cards for inline edits.

Layout & Accessibility
- Sidebar breakpoint changed from `lg` to `md` for better tablet support; related CSS/padding adjustments were added to main layout.
- Notifications dropdown: supports outside-click and Escape to close; notification items map to route URLs.

Developer checklist
- Ensure `.env.local` exists with Supabase keys to avoid using the mock client if the intent is to test against real data.
- When updating auth/profile behavior, update `src/providers/AuthProvider.jsx` and `src/lib/auth.js` and add tests for merged profile shapes.
- If adding new notification types, add a mapping in `src/components/layout/Notifications.jsx` (`getNotificationHref`).
- Profile preferences API: `/api/profile/preferences` handles GET (fetch) and PUT (update) for user theme, language, notification, and communication preferences.

Where to look
- Web app: `web/src/` — components, providers, lib
- Server-side helpers: `web/src/app/api/` route handlers
- Database migrations: `supabase/migrations/`

Testing notes
- Seed data can be found in `supabase/migrations/20260521000008_seed_data.sql` for working test credentials and sample mechanics/drivers.

If anything in this file becomes out of date, update both this file and the relevant README(s).
