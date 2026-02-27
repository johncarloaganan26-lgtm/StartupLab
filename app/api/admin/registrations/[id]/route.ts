import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'
import { authCookieName, verifyAuthToken } from '@/lib/auth'
import { logAdminAction } from '@/lib/audit'
import { sendRegistrationNotificationEmail, sendEventRegistrationEmail } from '@/lib/email'
import { createNotification, createNotificationForAdmin } from '@/lib/notifications'
import * as z from 'zod'

export const runtime = 'nodejs'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get(authCookieName)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = await verifyAuthToken(token)
  if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const schema = z.object({
    status: z.enum(['pending', 'confirmed', 'attended', 'cancelled', 'waitlisted', 'no-show', 'rejected']),
    reason: z.string().trim().max(500).optional(),
  })
  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

  const requestStatus: string = body.data.status
  const reason = body.data.reason || ''
  const newStatus = requestStatus

  const conn = await getDb().getConnection()
  try {
    await conn.beginTransaction()

    // 1. Get current status and event info
    const [infoRows] = await conn.execute(
      `SELECT
         r.status AS previous_status,
         u.id AS user_id,
         u.name AS user_name,
         u.email AS user_email,
         e.id AS event_id,
         e.title AS event_title,
         e.date AS event_date,
         e.time AS event_time,
         e.location AS event_location,
         e.available_slots
       FROM registrations r
       LEFT JOIN users u ON u.id = r.user_id
       LEFT JOIN events e ON e.id = r.event_id
       WHERE r.id = ?
       FOR UPDATE`,
      [id]
    )
    const info = (infoRows as any[]).length > 0 ? (infoRows as any[])[0] : null
    if (!info) throw new Error('Registration not found')

    const prevStatus = info.previous_status
    const eventId = info.event_id

    // 2. Handle available_slots logic
    // If moving TO confirmed, decrement slots
    if (newStatus === 'confirmed' && prevStatus !== 'confirmed') {
      if (info.available_slots <= 0) {
        throw new Error('No available slots for this event.')
      }
      await conn.execute('UPDATE events SET available_slots = available_slots - 1 WHERE id = ?', [eventId])
    }

    // If moving FROM confirmed, increment slots
    if (prevStatus === 'confirmed' && newStatus !== 'confirmed' && newStatus !== 'attended') {
      await conn.execute('UPDATE events SET available_slots = available_slots + 1 WHERE id = ?', [eventId])
    }

    // 3. Update registration status
    await conn.execute('UPDATE registrations SET status = ? WHERE id = ?', [newStatus, id])

    await conn.commit()

    logAdminAction({
      adminUserId: payload.sub,
      action: 'registration.update_status',
      entityType: 'registration',
      entityId: id,
      details: {
        status: newStatus,
        previousStatus: prevStatus,
        userId: String(info.user_id),
        userName: String(info.user_name),
        userEmail: String(info.user_email),
        eventId: String(eventId),
        eventTitle: String(info.event_title),
        reason: reason || undefined,
      },
    })

    // Send email notifications based on the new status
    const eventDate = info.event_date || 'TBD'
    const userName = String(info.user_name)
    const userEmail = String(info.user_email)
    const eventTitle = String(info.event_title)
    const eventTime = info.event_time || 'TBD'
    const eventLocation = info.event_location || 'TBD'

    console.log(`[Email] Sending ${newStatus} notification for registration ${id}`)
    console.log(`[Email] User: ${userName} (${userEmail}), Event: ${eventTitle}`)

    // Send notification email to support with the new status
    await sendRegistrationNotificationEmail(
      eventTitle,
      userName,
      userEmail,
      eventDate,
      newStatus
    )
    
    // Also send email to the user about their status change
    await sendEventRegistrationEmail(
      userEmail,
      userName,
      eventTitle,
      eventDate,
      eventTime,
      eventLocation,
      newStatus,
      {
        registrationId: id,
        eventId: String(eventId),
      }
    )

    // Create in-app notifications
    const userId = String(info.user_id)
    
    const displayStatus = requestStatus === 'no-show' ? 'no-show' : newStatus
    const reasonSuffix = reason ? ` Reason: ${reason}` : ''

    if (newStatus === 'confirmed') {
      await createNotification({
        userId,
        title: 'Registration Approved',
        message: `Your registration for "${eventTitle}" has been approved!`,
        type: 'registration_approved'
      })
      // Also notify admins
      await createNotificationForAdmin({
        title: 'Registration Approved',
        message: `${userName}'s registration for "${eventTitle}" has been approved.`,
        type: 'registration_approved'
      })
    } else if (displayStatus === 'cancelled' || displayStatus === 'no-show') {
      await createNotification({
        userId,
        title: 'Registration Rejected',
        message: `Your registration for "${eventTitle}" has been ${displayStatus === 'no-show' ? 'marked as no-show' : 'cancelled'}.${reasonSuffix}`,
        type: 'registration_rejected'
      })
      await createNotificationForAdmin({
        title: 'Registration Rejected',
        message: `${userName}'s registration for "${eventTitle}" has been ${displayStatus === 'no-show' ? 'marked as no-show' : 'cancelled'}.${reasonSuffix}`,
        type: 'registration_rejected'
      })
    } else if (newStatus === 'attended') {
      await createNotification({
        userId,
        title: 'Attendance Marked',
        message: `Your attendance for "${eventTitle}" has been recorded. Thank you!`,
        type: 'registration_attended'
      })
      await createNotificationForAdmin({
        title: 'Attendance Marked',
        message: `${userName} marked as attended for "${eventTitle}".`,
        type: 'registration_attended'
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    await conn.rollback()
    return NextResponse.json({ error: err.message || 'Action failed' }, { status: 500 })
  } finally {
    conn.release()
  }
}
