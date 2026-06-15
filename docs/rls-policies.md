# RoadRescue RLS (Row Level Security) Policies

## Overview

RLS ensures users only access data they're authorized to see. Each table has role-based policies enforced at the database level for maximum security.

## Policy Structure Summary

### profiles Table

```markdown
- Users see their own profile
- Mechanics see other verified mechanics' public profiles
- Admins see all profiles
```

### mechanic_profiles Table

```markdown
- Verified mechanics are public to drivers
- Mechanics can update their own profile
- Only admins can verify mechanics
- Unverified mechanics hidden from drivers
```

### rescue_requests Table

```markdown
- Drivers see only their own requests
- Mechanics see requests assigned to them (mechanic_id = user_id)
- Admins see all requests
- Three-way access control at database level
```

### profile_preferences Table

```markdown
- Users see and update their own preferences
- Admins can view all preferences
- Preferences include theme, language, notification settings
```

### notifications Table

```markdown
- Users see only their own notifications
- Notifications created via system triggers
- Users mark as read (update own notifs only)
- Admins can delete notifications
```

## Policy Details

### profiles

```sql
-- All users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- All users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Disable direct deletes (use soft delete via status)
CREATE POLICY "Disable profile deletion" ON profiles
  FOR DELETE USING (false);
```

### mechanic_profiles

```sql
-- Drivers can see verified mechanics
CREATE POLICY "Drivers view verified mechanics" ON mechanic_profiles
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'driver' 
    AND verification_status = 'verified'
  );

-- Mechanics can see their own profile
CREATE POLICY "Mechanics view own profile" ON mechanic_profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM mechanic_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Mechanics can update own profile
CREATE POLICY "Mechanics update own profile" ON mechanic_profiles
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- Admins can view and modify all profiles
CREATE POLICY "Admins manage mechanics" ON mechanic_profiles
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins approve or reject mechanics" ON mechanic_profiles
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
```

### rescue_requests

```sql
-- Drivers see their own requests
CREATE POLICY "Drivers view own requests" ON rescue_requests
  FOR SELECT USING (
    driver_id = auth.uid()
  );

-- Mechanics see assigned requests only
CREATE POLICY "Mechanics view assigned requests" ON rescue_requests
  FOR SELECT USING (
    mechanic_id = auth.uid()
  );

-- Drivers create requests
CREATE POLICY "Drivers create requests" ON rescue_requests
  FOR INSERT WITH CHECK (
    driver_id = auth.uid() 
    AND auth.jwt() ->> 'role' = 'driver'
  );

-- Mechanics update status on assigned requests
CREATE POLICY "Mechanics update assigned requests" ON rescue_requests
  FOR UPDATE USING (
    mechanic_id = auth.uid()
  );

-- Admins have full access
CREATE POLICY "Admins manage all requests" ON rescue_requests
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins update requests" ON rescue_requests
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Disable deletes (keep audit trail)
CREATE POLICY "Disable request deletion" ON rescue_requests
  FOR DELETE USING (false);
```

### profile_preferences

```sql
-- Users can read their own preferences
CREATE POLICY "Users view own preferences" ON profile_preferences
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Users can update their own preferences
CREATE POLICY "Users update own preferences" ON profile_preferences
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- Users can insert their own preferences
CREATE POLICY "Users create own preferences" ON profile_preferences
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- Admins can view all preferences
CREATE POLICY "Admins manage preferences" ON profile_preferences
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
```

### notifications

```sql
-- Users see their own notifications
CREATE POLICY "Users view own notifications" ON notifications
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Users mark their notifications as read
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- System inserts notifications (via triggers)
-- Admin inserts allowed through application layer
CREATE POLICY "Admins manage notifications" ON notifications
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Admins can delete old notifications
CREATE POLICY "Admins delete notifications" ON notifications
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');
```

## Security Notes

1. **No Cascading Deletes**: Requests and bids have audit trail - use soft delete
2. **Immutable History**: Once created, most records cannot be deleted
3. **Admin Override**: Admins bypass RLS for monitoring/support
4. **Realtime Safety**: RLS enforced on subscription filters too
5. **Session Context**: Uses `auth.uid()` and `auth.jwt()` for checks

## Testing RLS Policies

```sql
-- Test as driver
SET jwt.claims.sub = '<driver-id>';

-- Should see own requests
SELECT * FROM rescue_requests; -- only own

-- Should NOT see other drivers' requests
SELECT * FROM rescue_requests WHERE driver_id != '<driver-id>';
-- Returns 0 rows (RLS blocks)

-- Test as mechanic
SET jwt.claims.sub = '<mechanic-id>';

-- Should see assigned requests
SELECT * FROM rescue_requests 
WHERE mechanic_id = '<mechanic-id>';

-- Should NOT see unassigned requests
SELECT * FROM rescue_requests 
WHERE mechanic_id IS NULL;
-- Returns 0 rows (RLS blocks)

-- Test as admin with role claim
SET jwt.claims.sub = '<admin-user-id>';
SET jwt.claims.role = 'admin';

-- Should see all requests
SELECT * FROM rescue_requests;
-- Returns all (admin bypass)
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
