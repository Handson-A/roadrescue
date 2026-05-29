# How to Push Migrations to Supabase

## Option 1: Using Supabase Dashboard (Easiest)

1. Go to **[https://app.supabase.com](https://app.supabase.com)** → Select your project
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"** or **"New SQL Snippet"**
4. Copy-paste the contents of each migration file **in order**:
   ```
   20260521000000_reset_all_tables.sql
   20260521000001_init_extensions.sql
   20260521000002_create_profiles.sql
   20260521000003_create_mechanic_profiles.sql
   20260521000004a_add_missing_rescue_request_columns.sql
   20260521000004b_create_driver_profiles.sql
   20260521000004c_driver_profiles_rls.sql
   20260521000004_create_rescue_requests.sql
   20260521000005_create_request_bids.sql
   20260521000006_create_notifications.sql
   20260521000007_rls_policies.sql
   20260521000008_geospatial_functions.sql
   20260521000009_request_lifecycle_helpers.sql
   20260521000010_create_profile_preferences.sql
   20260521000011_create_profile_change_requests.sql
   20260521000012_profile_preferences_rls.sql
   ```
5. Click **"Run"** for each query
6. Verify tables appear in **"Table Editor"**

---

## Option 2: Using Supabase CLI (Recommended)

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Login
```bash
supabase login
```

### 3. Link Your Project
```bash
cd roadrescue
supabase link --project-ref your-project-ref
```
(Find `project-ref` in Supabase dashboard → Project Settings → General)

### 4. Push Migrations
```bash
supabase db push
```

This automatically runs all migrations in `supabase/migrations/` in order.

---

## Verify Success

Check that these tables exist in your Supabase dashboard:
- ✅ `profiles`
- ✅ `mechanic_profiles`
- ✅ `driver_profiles`
- ✅ `rescue_requests`
- ✅ `request_bids`
- ✅ `notifications`
- ✅ `profile_preferences`
- ✅ `profile_change_requests`

---

## If You Get Errors

**Error: "Function already exists"**
- Comment out the `create or replace function` line
- Use `drop function if exists` first

**Error: "Extension not found"**
- Run `20260521000001_init_extensions.sql` first

**Error: "Table not found"**
- Check that migrations ran in the correct order
- Run reset migration (`20260521000000`) first to clear, then re-run all

---

## Next: Test the Database

After migrations are pushed:

```bash
# In your Next.js app, test the rescue_requests table
curl -X POST http://localhost:3000/api/requests \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_type": "repair",
    "problem_description": "Car won't start",
    "latitude": 5.6037,
    "longitude": -0.1870,
    "address": "Accra, Ghana"
  }'
```
