import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@roadrescue.com',
      to,
      subject,
      html: htmlContent || `<p>${message}</p>`,
    })

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
