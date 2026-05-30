import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const primaryFromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@roadrescue.com'
const fallbackFromEmail = 'RoadRescue <onboarding@resend.dev>'

async function sendEmail({ to, subject, html }) {
  return resend.emails.send({
    from: primaryFromEmail,
    to,
    subject,
    html,
  })
}

export async function POST(request) {
  try {
    const { to, subject, message, htmlContent, templateData } = await request.json()

    if (!to) {
      return Response.json({ error: 'Missing recipient email' }, { status: 400 })
    }

    if (!subject) {
      return Response.json({ error: 'Missing email subject' }, { status: 400 })
    }

    if (!message && !htmlContent) {
      return Response.json({ error: 'Missing email body (message or htmlContent)' }, { status: 400 })
    }

    const html = htmlContent || `<p>${message}</p>`

    let result = await sendEmail({ to, subject, html })

    if (result.error?.statusCode === 403 || result.error?.name === 'validation_error') {
      console.warn('Primary Resend sender rejected, retrying with fallback onboarding sender')
      result = await resend.emails.send({
        from: fallbackFromEmail,
        to,
        subject,
        html,
      })
    }

    if (result.error) {
      console.error('Resend error:', result.error)
      return Response.json({ error: 'Failed to send email', details: result.error }, { status: 500 })
    }

    return Response.json({ success: true, messageId: result.data.id }, { status: 200 })
  } catch (error) {
    console.error('Email API error:', error)
    return Response.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
