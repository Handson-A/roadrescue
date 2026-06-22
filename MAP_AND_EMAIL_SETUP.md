# Map & Email Setup Guide

## Current State

### Maps
**Status**: ✅ Leaflet fully integrated (no API key required)

- **Package**: `leaflet` and `react-leaflet` (installed in package.json)
- **Current Implementation**: LocationPicker and RescueMap components use Leaflet with OpenStreetMap
- **Features**:
  - Interactive map with click-to-select location
  - Automatic geolocation detection
  - Reverse geocoding via Nominatim (OpenStreetMap)
  - Driver/Mechanic tracking with route visualization

### Email
**Status**: ✅ Resend configured for email notifications

- **Package**: `resend` SDK installed
- **API**: `/api/notifications/email` available
- **Features**: Email notifications for rescue requests and status updates

---

## What You Need

### 1️⃣ Leaflet / OpenStreetMap (Ready to Use)

Leaflet works out of the box with OpenStreetMap tiles. **No API key or signup required.**

**Optional**: You can use Mapbox tiles for better styling by setting:
```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.ey...
```

Then change the TileLayer URL in `LocationPicker.jsx` and `RescueMap.jsx` to:
```
url={`https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
```

### 2️⃣ Email Service (Pick One)

#### Option A: **Sendgrid** (recommended for scale)
```bash
npm install @sendgrid/mail
```
1. Sign up free at [sendgrid.com](https://sendgrid.com)
2. Create API key
3. Add to `.env.local`:
```
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@yourapp.com
```

#### Option B: **Resend** (simple, modern)
```bash
npm install resend
```
1. Sign up free at [resend.com](https://resend.com)
2. Create API key
3. Add to `.env.local`:
```
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@yourapp.com
```

#### Option C: **Nodemailer** (free SMTP, requires provider like Gmail)
```bash
npm install nodemailer
```
1. Use Gmail or custom SMTP
2. Add to `.env.local`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourapp.com
```

---

## What the Code Currently Does

### Maps
- **LocationPicker.jsx**: Interactive Leaflet map with click selection and geolocation
- **RescueMap.jsx**: Live tracking map showing driver and mechanic positions with route line

### Email
- **Email API available** at `/api/notifications/email`
- **Profile preferences API** at `/api/profile/preferences` handles user preferences
- **Needed**: Configure email provider (SendGrid, Resend, or SMTP) for:
   - New rescue request alerts
   - Job status update notifications
   - Job completed reminders
   - Profile change request confirmations

---

## Current `.env.local` Template

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Service role (backend only, never expose)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# AI Diagnostics (Gemini)
GEMINI_API_KEY=your-gemini-key

# Optional: Mapbox for custom map tiles
# NEXT_PUBLIC_MAPBOX_TOKEN=pk.ey...

# Email Service (pick one)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@roadrescue.com
# OR
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@roadrescue.com
```

---

## What Would You Like to Do?

1. **Set up email** (Resend, SendGrid, Nodemailer)?
2. **Both** — I can create the config setup, and API routes?