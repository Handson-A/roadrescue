# RoadRescue — Web app (Developer README)

This README covers local development and a few recent developer-facing changes specific to the web application.

Quick start

1. Install dependencies
```bash
cd web
npm install
```

2. Add environment variables
Create `.env.local` in `web/` with the following values:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
OPENAI_API_KEY=your_openai_key
```
If the Supabase envs are missing the app falls back to a mock Supabase client (useful for offline UI work). To force mock behavior set `NEXT_PUBLIC_USE_MOCK_AUTH=true`.

3. Run locally
```bash
npm run dev
```

Build
```bash
npm run build
```

Developer notes (recent)
- Auth merging: `AuthProvider` now fetches and flattens `driver_profiles` and `mechanic_profiles` into the shared `profile` returned to the UI. This avoids missing fields on dashboards.
- Login/Register gating: login and register flows now require a DB-backed role before auto-routing into role dashboards. This prevents accidental auto-login as the mock 'driver'.
- Sign-out: uses client-side navigation (`router.replace('/auth/login')`) to avoid full reloads.
- Mechanic earnings: removed from sidebar; earnings shown on `dashboard/mechanic/account` as an earnings card with edit actions.
- Responsive sidebar: breakpoint moved from `lg` to `md`.
- Notifications: outside-click and Escape close the dropdown; items navigate to the related pages.

Files to check when changing behavior
- `src/providers/AuthProvider.jsx`
- `src/lib/auth.js`
- `src/components/layout/Navbar.jsx`
- `src/components/layout/Sidebar.jsx`
- `src/components/layout/Notifications.jsx`
- `src/app/dashboard/mechanic/account/page.jsx`

If you change any of the above flows, please update this README and [docs/DEVELOPER_NOTES.md](../docs/DEVELOPER_NOTES.md).
