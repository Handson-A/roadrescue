# Quick Reference: RBAC & Navigation Setup

## New RBAC System

### Three Layers of Protection

```
┌─────────────────────────────────────────────┐
│ Layer 1: MIDDLEWARE (Edge)                  │
│ Check: User auth + role + dashboard match   │
│ Blocks: Cross-role dashboard access         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ Layer 2: API ROUTES                         │
│ Check: User role matches endpoint           │
│ Blocks: Driver accessing /api/admin/stats   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ Layer 3: COMPONENTS                         │
│ Check: User role matches page allowedRoles  │
│ Blocks: Unauthorized UI sections            │
└─────────────────────────────────────────────┘
```

---

## 📱 Navigation Structure

### Mobile (4 Tabs per Role)

```
DRIVER                  MECHANIC                ADMIN
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ 🏠 Dashboard    │    │ 🏠 Dashboard    │    │ 📊 Dashboard    │
│ 🚗 Requests     │    │ 🔧 Jobs         │    │ 🛠️  System      │
│ ⚙️  Settings    │    │ 📜 History      │    │ 📈 Reports      │
│ 👤 Account      │    │ 👤 Account      │    │ ⚙️  Settings    │
│ ⚙️  Settings    │    │ ⚙️  Settings    │    │ 👤 Account      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

All tabs contain nested routes:
- `/dashboard/driver/settings` 
- `/dashboard/mechanic/job/[id]`
- `/dashboard/admin/reports`
- etc.

---

## 🔒 How to Protect a Route

### Protect API Endpoint

```javascript
import { requireDriver, createErrorResponse } from '@/lib/rbac'

export async function POST(request) {
  const result = await requireDriver()
  if (result.error) return createErrorResponse(result.error, result.status)
  
  const { user, profile } = result
  // Safe to proceed - user is verified driver
}
```

### Protect Entire Page

```jsx
import { RBACProtectedPage } from '@/components/auth/RBACProtected'

export default function DriverPage() {
  return (
    <RBACProtectedPage allowedRoles={['driver']}>
      <h1>Driver Dashboard</h1>
    </RBACProtectedPage>
  )
}
```

### Protect Page Section

```jsx
import { AdminOnly, DriverOnly } from '@/components/auth/RBACProtected'

export default function MixedPage() {
  return (
    <>
      <DriverOnly>
        <DriverContent />
      </DriverOnly>
      
      <AdminOnly>
        <AdminPanel />
      </AdminOnly>
    </>
  )
}
```

---

## 🚫 What's Blocked

| User | Tries | Result |
|------|-------|--------|
| Driver | `/dashboard/mechanic` | 403 + log + redirect |
| Driver | `/api/admin/stats` | 403 Forbidden |
| Mechanic | Place new request | Component hidden + API 403 |
| User | Access `/dashboard/*` unauthenticated | 401 Redirect to login |

---

## ✅ Security Guarantees

- [x] **Drivers see ONLY driver content**
  - Own requests, settings, profile
  - Cannot see mechanic garage or admin stats

- [x] **Mechanics see ONLY mechanic content**
  - Assigned jobs, availability, ratings
  - Cannot create requests or access admin

- [x] **Admins see EVERYTHING**
  - All users, requests, mechanics
  - Can view/edit platform settings

- [x] **Cross-role access log recorded**
  - `[SECURITY] Cross-role access attempt: User X (role) tried to access Y`

---

## 🧪 Quick Test

```bash
# Test 1: Can a driver visit /dashboard/mechanic?
1. Login as driver@roadrescue.gh
2. Manually visit: http://localhost:3000/dashboard/mechanic
3. Should redirect to: http://localhost:3000/unauthorized ✅

# Test 2: Can API be accessed by wrong role?
curl -H "Authorization: Bearer DRIVER_TOKEN" \
     http://localhost:3000/api/admin/stats
# Should return 403 Forbidden ✅

# Test 3: Do nested routes work?
1. Login as driver
2. Click "Settings" tab (bottom nav)
3. Should navigate to: /dashboard/driver/settings ✅
4. Should show driver settings, not mechanic settings ✅
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `lib/rbac.js` | RBAC protection functions |
| `components/auth/RBACProtected.jsx` | Component protection wrappers |
| `middleware.js` | Route-level RBAC enforcement |
| `components/layout/BottomNav.jsx` | Mobile navigation (4 tabs) |
| `RBAC-IMPLEMENTATION.md` | Full RBAC documentation |

---

## 🎯 Next Priority Checkpoints

1. **Verify all API routes use RBAC protection**
   - [ ] Check `/api/admin/*` has `requireAdmin()`
   - [ ] Check `/api/mechanics/*` has `requireMechanic()` 
   - [ ] Check `/api/requests/*` has `requireDriver()`

2. **Test cross-role access blocking**
   - [ ] Driver can't access mechanic routes
   - [ ] Mechanic can't call admin APIs
   - [ ] Admin-only UIs are hidden for other roles

3. **Verify database RLS policies**
   - [ ] Drivers see only own requests
   - [ ] Mechanics see only assigned jobs
   - [ ] Each role can only update own data

4. **Monitor security logs**
   - [ ] Set up monitoring for `[SECURITY]` logs
   - [ ] Alert on repeated cross-role attempts

---

## ⚠️ Common Mistakes to Avoid

❌ Forget to check role in API route
❌ Rely only on component hiding (use middleware)
❌ Trust client-side role values
❌ Forget to redirect after role change
❌ Skip `RBACProtectedPage` wrapper on sensitive pages

✅ Always use `requireRole()` in APIs
✅ Use middleware for route protection
✅ Verify role server-side
✅ Log security events
✅ Test cross-role access
