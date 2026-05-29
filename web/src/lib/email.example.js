/**
 * EXAMPLE: How to use email notifications in API routes
 * This shows the pattern for integrating email with rescue request lifecycle
 */

// In web/src/app/api/requests/route.js (when driver creates a rescue request):

import { sendNotificationEmail } from '@/lib/email'

export async function POST(request) {
  // ... your existing code to create rescue request ...

  // After creating the request and finding nearby mechanics:

  const nearbyMechanics = [/* ... */]

  for (const mechanic of nearbyMechanics) {
    // Send email notification to each nearby mechanic
    await sendNotificationEmail({
      to: mechanic.email, // get from profiles table
      subject: `🚗 New Rescue Request: ${issue_description}`,
      type: 'new_request',
      data: {
        mechanicName: mechanic.full_name,
        issueDescription: rescueRequest.issue_description,
        location: rescueRequest.location_address,
        distance: `${mechanic.distance_km} km`,
        appUrl: 'https://roadrescue.com/requests',
      },
    })
  }

  return Response.json({ success: true, request: rescueRequest })
}

// ─────────────────────────────────────────────────────────

// In web/src/app/api/requests/[id]/route.js (when driver accepts a bid):

import { sendNotificationEmail } from '@/lib/email'

export async function PATCH(request, { params }) {
  // ... your existing bid acceptance code ...

  const acceptedBid = /* ... */
  const mechanic = /* ... */
  const driver = /* ... */

  // Send email to mechanic that their bid was accepted
  await sendNotificationEmail({
    to: mechanic.email,
    subject: '✅ Your Bid Was Accepted!',
    type: 'bid_accepted',
    data: {
      mechanicName: mechanic.full_name,
      driverName: driver.full_name,
      location: rescueRequest.location_address,
      bidAmount: acceptedBid.proposed_price,
      appUrl: 'https://roadrescue.com/requests',
    },
  })

  return Response.json({ success: true })
}

// ─────────────────────────────────────────────────────────

// In web/src/app/api/requests/[id]/route.js (when mechanic marks job completed):

import { sendNotificationEmail } from '@/lib/email'

export async function PATCH(request, { params }) {
  // ... your existing completion code ...

  const mechanic = /* ... */
  const driver = /* ... */

  // Send email to driver that job is done
  await sendNotificationEmail({
    to: driver.email,
    subject: '🎉 Your Rescue Service Is Complete!',
    type: 'job_completed',
    data: {
      driverName: driver.full_name,
      mechanicName: mechanic.full_name,
      appUrl: 'https://roadrescue.com/requests',
    },
  })

  return Response.json({ success: true })
}
