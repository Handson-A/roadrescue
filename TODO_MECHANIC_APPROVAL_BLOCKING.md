# TODO: Mechanic approval lifecycle + permanent email blocking

## Step 1 — DB blocklist + triggers
- [x] Add migration to create `blocked_emails` table (email unique)
- [x] Add SQL trigger to block auth user signup when email exists in `blocked_emails`

## Step 2 — Admin reject behavior
- [x] Update `web/src/app/api/admin/mechanics/route.js`:
  - [x] on reject: set `mechanic_profiles.verification_status` to `rejected`
  - [x] insert mechanic's email into `blocked_emails`
  - [x] delete auth user to destroy active sessions

## Step 3 — Backend enforcement for accepting jobs
- [x] Update `web/src/lib/request.js` in `updateRequestStatus()`:
  - [x] if accepted by mechanic: allow only when `mechanic_profiles.verification_status === 'approved'`
  - [x] reject when verification_status is `pending` or `rejected`

## Step 4 — Frontend gating
- [x] Update `web/src/app/dashboard/mechanic/account/page.jsx`:
  - [x] hide "Accept Job" action unless mechanic is approved
  - [x] show disabled/pending message when not verified

## Step 5 — Testing
- [ ] Run `npm run lint` and `npm run build` in `web/`
- [ ] Apply Supabase migration
- [ ] Manual test:
  - [ ] pending mechanic can login but cannot accept requests
  - [ ] approved mechanic can accept
  - [ ] rejected mechanic cannot accept and cannot sign up again