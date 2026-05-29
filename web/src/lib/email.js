/**
 * Email notification helper for Resend
 * Use this to send notifications to drivers, mechanics, admins
 */

export async function sendNotificationEmail({
  to,
  subject,
  type, // 'new_request', 'bid_received', 'bid_accepted', 'job_completed', etc.
  data, // context-specific data (e.g., driver name, mechanic name, request details)
}) {
  if (!to) {
    console.error('sendNotificationEmail: missing recipient email')
    return null
  }

  // Build HTML content based on notification type
  const htmlContent = buildEmailTemplate(type, data)

  try {
    const response = await fetch('/api/notifications/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        htmlContent,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Failed to send notification email:', error)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending notification email:', error)
    return null
  }
}

/**
 * Build HTML email templates for different notification types
 */
function buildEmailTemplate(type, data = {}) {
  const baseStyle = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    background: #f8f8f8;
    padding: 20px;
  `

  const headerStyle = `
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
    color: white;
    padding: 30px;
    border-radius: 12px 12px 0 0;
    text-align: center;
  `

  const contentStyle = `
    background: white;
    padding: 30px;
    border-radius: 0 0 12px 12px;
  `

  const buttonStyle = `
    display: inline-block;
    background: #ffd700;
    color: #111827;
    padding: 12px 24px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: bold;
    margin-top: 20px;
  `

  switch (type) {
    case 'new_request':
      return `
        <div style="${baseStyle}">
          <div style="${headerStyle}">
            <h1 style="margin: 0; font-size: 24px;"> ! New Rescue Request</h1>
          </div>
          <div style="${contentStyle}">
            <p>Hi <strong>${data.mechanicName || 'Mechanic'}</strong>,</p>
            <p>A new rescue request has been posted near you:</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Issue:</strong> ${data.issueDescription || 'Vehicle breakdown'}</p>
              <p><strong>Location:</strong> ${data.location || 'Accra'}</p>
              <p><strong>Distance:</strong> ${data.distance || 'N/A'} away</p>
            </div>
            <p>Check the app to place your bid and help this driver!</p>
            <a href="${data.appUrl || 'https://roadrescue.com/requests'}" style="${buttonStyle}">View Request</a>
          </div>
        </div>
      `

    case 'bid_accepted':
      return `
        <div style="${baseStyle}">
          <div style="${headerStyle}">
            <h1 style="margin: 0; font-size: 24px;">✅ Bid Accepted!</h1>
          </div>
          <div style="${contentStyle}">
            <p>Hi <strong>${data.mechanicName || 'Mechanic'}</strong>,</p>
            <p>Great news! Your bid has been accepted by <strong>${data.driverName || 'the driver'}</strong>.</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Driver:</strong> ${data.driverName}</p>
              <p><strong>Location:</strong> ${data.location}</p>
              <p><strong>Your bid:</strong> GHS ${data.bidAmount || 'N/A'}</p>
            </div>
            <p>Head to the location now!</p>
            <a href="${data.appUrl || 'https://roadrescue.com/requests'}" style="${buttonStyle}">Start Navigation</a>
          </div>
        </div>
      `

    case 'bid_missed':
      return `
        <div style="${baseStyle}">
          <div style="${headerStyle}">
            <h1 style="margin: 0; font-size: 24px;">ℹ️ Request Assigned</h1>
          </div>
          <div style="${contentStyle}">
            <p>Hi <strong>${data.mechanicName || 'Mechanic'}</strong>,</p>
            <p>The driver selected another mechanic for this rescue request.</p>
            <p>Don't worry—more requests are coming your way. Keep your app open!</p>
            <a href="${data.appUrl || 'https://roadrescue.com/requests'}" style="${buttonStyle}">Browse More Requests</a>
          </div>
        </div>
      `

    case 'request_cancelled':
      return `
        <div style="${baseStyle}">
          <div style="${headerStyle}">
            <h1 style="margin: 0; font-size: 24px;">ℹ️ Request Cancelled</h1>
          </div>
          <div style="${contentStyle}">
            <p>Hi <strong>${data.mechanicName || data.driverName || 'User'}</strong>,</p>
            <p>A rescue request has been cancelled.</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Reason:</strong> ${data.reason || 'Unknown'}</p>
            </div>
            <p>Keep an eye out for new requests and continue helping drivers in need!</p>
            <a href="${data.appUrl || 'https://roadrescue.com/requests'}" style="${buttonStyle}">View Requests</a>
          </div>
        </div>
      `

    case 'job_completed':
      return `
        <div style="${baseStyle}">
          <div style="${headerStyle}">
            <h1 style="margin: 0; font-size: 24px;"> Job Complete!</h1>
          </div>
          <div style="${contentStyle}">
            <p>Hi <strong>${data.driverName || 'Driver'}</strong>,</p>
            <p><strong>${data.mechanicName || 'The mechanic'}</strong> has completed your rescue request.</p>
            <p>Please take a moment to rate your experience and leave feedback.</p>
            <a href="${data.appUrl || 'https://roadrescue.com/requests'}" style="${buttonStyle}">Rate & Review</a>
          </div>
        </div>
      `

    case 'mechanic_en_route':
      return `
        <div style="${baseStyle}">
          <div style="${headerStyle}">
            <h1 style="margin: 0; font-size: 24px;"> Mechanic On The Way</h1>
          </div>
          <div style="${contentStyle}">
            <p>Hi <strong>${data.driverName || 'Driver'}</strong>,</p>
            <p><strong>${data.mechanicName || 'Your mechanic'}</strong> is on the way to your location.</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Estimated arrival:</strong> ${data.estimatedArrival || '10-15 minutes'}</p>
              <p><strong>Mechanic:</strong> ${data.mechanicName}</p>
            </div>
            <p>Track their location in real-time in the app.</p>
            <a href="${data.appUrl || 'https://roadrescue.com/requests'}" style="${buttonStyle}">Track Location</a>
          </div>
        </div>
      `

    default:
      return `
        <div style="${baseStyle}">
          <div style="${headerStyle}">
            <h1 style="margin: 0; font-size: 20px;"> RoadRescue Notification</h1>
          </div>
          <div style="${contentStyle}">
            <p>${data.message || 'You have a new notification.'}</p>
            <a href="${data.appUrl || 'https://roadrescue.com'}" style="${buttonStyle}">Open App</a>
          </div>
        </div>
      `
  }
}
