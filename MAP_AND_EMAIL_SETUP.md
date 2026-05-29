# Map & Email Setup Guide

## Current State

### Maps
**Status**: ✅ Library installed, ⏳ API key not yet configured

- **Package**: `@googlemaps/js-api-loader` (installed in package.json)
- **Current Implementation**: LocationPicker component uses browser `navigator.geolocation` API
- **Next Step**: Add Google Maps JS API key and integrate interactive map widget

### Email
**Status**: ⏳ Not configured

- **No email library** currently installed (SendGrid, Resend, Nodemailer, etc.)
- **Use Case**: Notifications (job alerts, bid updates, completion confirmations)
- **Decision Needed**: Which email provider (SendGrid free tier, Resend, or simple SMTP)?

---

## What You Need

### 1️⃣ Google Maps API Key

**Get it:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable these APIs:
   - Google Maps JavaScript API
   - Google Maps Geocoding API (optional, for reverse geocoding)
   - Places API (optional, for address autocomplete)
4. Create an **API Key** credential
5. Restrict it to:
   - Application: Web browser
   - Websites / HTTP referrers: `localhost:3000`, `yourdomain.com`

**Add to `.env.local`:**
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
```

**Cost**: Free tier includes $200/month credit; ~$7 per 1000 map loads

---

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
- **LocationPicker.jsx**: Uses `navigator.geolocation` to get user's browser location (works, no API key needed)
- **Next step**: Render interactive Google Map widget to visualize mechanic locations in real-time

### Email
- **No email sending implemented yet**
- **Needed**: API route like `/api/notifications/email` to send:
  - New rescue request alerts
  - Bid received notifications
  - Bid accepted/rejected messages
  - Job completed reminders

---

## Quick Setup Steps

### 1. Add Google Maps API Key
```bash
# In roadrescue/web/.env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE
```

### 2. Install Email Library
```bash
cd roadrescue/web
npm install resend  # or @sendgrid/mail or nodemailer
```

### 3. Add Email Config
```bash
# In roadrescue/web/.env.local
RESEND_API_KEY=YOUR_KEY_HERE
RESEND_FROM_EMAIL=noreply@roadrescue.com
```

### 4. Create Email Notification API Route
```javascript
// web/src/app/api/notifications/email/route.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  const { to, subject, message } = await request.json();
  
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      subject,
      html: message,
    });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

---

## Current `.env.local` Template

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Service role (backend only, never expose)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# OpenAI (for AI diagnostics)
OPENAI_API_KEY=sk-...

# Google Maps (optional but recommended)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...

# Email Service (pick one)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@roadrescue.com
# OR
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@roadrescue.com
```

---

## What Would You Like to Do?

1. **Set up Google Maps** integration first?
2. **Choose and set up email** (Resend, SendGrid, Nodemailer)?
3. **Both** — I can create the migration files, config setup, and API routes?

Let me know which providers you want and I'll handle the full setup!
