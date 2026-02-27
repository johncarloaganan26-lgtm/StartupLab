import { NextResponse } from 'next/server'
import { sendContactFormConfirmationEmail, sendContactFormNotificationToAdmin } from '@/lib/email'
import { createNotificationForAdmin } from '@/lib/notifications'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = String(body?.name ?? '').trim()
    const email = String(body?.email ?? '').trim()
    const company = String(body?.company ?? '').trim()
    const mobile = String(body?.mobile ?? '').trim()
    const eventType = String(body?.interest ?? '').trim()
    const message = String(body?.message ?? '').trim()

    if (!name || !email || !mobile || !message) {
      return NextResponse.json({ error: 'Name, email, mobile, and message are required.' }, { status: 400 })
    }

    // Send thank you email to the guest
    await sendContactFormConfirmationEmail(email, name)

    // Send notification to admin
    await sendContactFormNotificationToAdmin(name, email, company, mobile, eventType, message)

    // Create admin notification in the system
    await createNotificationForAdmin({
      title: 'New Contact Form Submission',
      message: `${name} (${email}) submitted a contact form. ${eventType ? `Interested in: ${eventType}` : ''}`,
      type: 'general'
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
}
