# RoadRescue RLS (Row Level Security) Policies

## Overview

RLS ensures users only access data they're authorized to see. Each table has role-based policies.

## Policy Structure

### profiles Table
```sql
-- Users see their own profile
SELECT: auth.uid() = id OR role = 'admin'
UPDATE: auth.uid() = id (own profile only)
DELETE: Never (soft delete via status)

-- Mechanics see other mechanics' public info
SELECT: role = 'mechanic' for public profiles
```

### mechanic_profiles Table
```sql
-- Verified mechanics are public
SELECT: verification_status = 'verified' OR own profile OR admin

-- Mechanics can update their own profile
UPDATE: auth.uid() = user_id

-- Only admins can verify mechanics
UPDATE (verification_status): admin only
```

### rescue_requests Table
```sql
-- Three-way access control:
SELECT: driver = auth.uid() OR assigned_mechanic = auth.uid() OR admin
CREATE: driver = auth.uid() (drivers create requests)
UPDATE: assigned_mechanic can update status OR admin
DELETE: Never allowed

-- Drivers see only their requests
-- Mechanics see only assigned requests
-- Admins see all
```

### request_bids Table
```sql
-- Mechanics can create bids
INSERT: mechanic = auth.uid()

-- Driver and mechanic see relevant bids
SELECT: driver of request OR bidding mechanic OR admin

-- Bid acceptance handled at app level
UPDATE: admin only (at database level)
```

### notifications Table
```sql
-- Users see only their notifications
SELECT: user_id = auth.uid()
INSERT: System only (via triggers or app)
UPDATE: user only (mark as read)
```

---

## Admin Access Patterns

Admins have elevated permissions:

```sql
-- Super-admin SELECT policy (all tables)
SELECT: auth.jwt() ->> 'role' = 'admin'

-- Specific admin actions:
-- 1. Verify mechanics
UPDATE mechanic_profiles SET verification_status = 'verified'
  WHERE verified_by = admin_uid

-- 2. View all requests
SELECT * FROM rescue_requests (no WHERE clause)

-- 3. Disable users
UPDATE profiles SET status = 'suspended'

-- 4. View all finances (future)
SELECT * FROM payments WHERE 1=1
```

---

## Security Best Practices Implemented

1. **No PUBLIC Access**: No policies without explicit user checks
2. **Immutable Records**: Can't delete rescue histories
3. **Audit Trail**: created_at on all tables, verified_at for mechanics
4. **Role Isolation**: Drivers can't see mechanic pricing or finance
5. **Temporal Security**: timestamp verification for access control

---

## Testing RLS Policies

```javascript
// Test as driver
const driverClient = supabase.auth.getSession();  // driver@example.com
const result = await driverClient
  .from('rescue_requests')
  .select('*');
// Should only see own requests

// Test as mechanic
const mechanicClient = supabase.auth.getSession();  // mechanic@example.com
const result = await mechanicClient
  .from('rescue_requests')
  .select('*');
// Should only see assigned requests

// Test as admin
const adminClient = supabase.auth.getSession();  // admin@example.com
const result = await adminClient
  .from('rescue_requests')
  .select('*');
// Should see all requests
```

---

## Enforcement Points

- Database: RLS policies (primary)
- API Layer: Additional authorization checks
- Client: UI hides restricted features
- Audit: Log all policy violations

---

## Known Limitations & Future Improvements

1. **Realtime RLS**: Limited to preset policies, no custom realtime filters
2. **Complex Rules**: Some business logic still in app layer
3. **Performance**: RLS can add query overhead on large tables
4. **Testing**: Need automated compliance testing suite

---

## Related Documentation

- See `api-reference.md` for API-level authorization
- See `architecture.md` for complete security overview
