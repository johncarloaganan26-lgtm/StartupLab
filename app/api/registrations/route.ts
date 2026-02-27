import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'
import { authCookieName, verifyAuthToken } from '@/lib/auth'
import { logUserAction } from '@/lib/audit'
import { sendEventRegistrationEmail, sendRegistrationNotificationEmail } from '@/lib/email'
import { createNotification, createNotificationForAdmin } from '@/lib/notifications'

export const runtime = 'nodejs'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(authCookieName)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await verifyAuthToken(token)
  const [rows] = await getDb().execute(
    `SELECT r.id, r.event_id, r.status, r.registered_at, e.title, e.date, e.time, e.location
     FROM registrations r
     JOIN events e ON e.id = r.event_id
     WHERE r.user_id = ?
     ORDER BY r.registered_at DESC`,
    [payload.sub]
  )

  const registrations = (rows as any[]).map((row) => ({
    id: String(row.id),
    eventId: String(row.event_id),
    userId: String(payload.sub),
    status: row.status,
    registeredAt: row.registered_at,
  }))

  return NextResponse.json({ registrations })
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(authCookieName)?.value
    if (!token) throw new Error('Unauthorized')
    const payload = await verifyAuthToken(token)

    const body = await req.json()
    const eventId = Number(body.eventId)
    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required.' }, { status: 400 })
    }

    const [existing] = await getDb().execute(
      'SELECT id, status FROM registrations WHERE event_id = ? AND user_id = ? LIMIT 1',
      [eventId, payload.sub]
    )
    if ((existing as any[]).length > 0) {
      const row = (existing as any[])[0]
      if (row.status !== 'cancelled') {
        return NextResponse.json({ error: 'Already registered.' }, { status: 409 })
      }
    }

    const [eventRows] = await getDb().execute(
      'SELECT id, title, date, time, location, available_slots FROM events WHERE id = ? LIMIT 1',
      [eventId]
    )
    if ((eventRows as any[]).length === 0) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
    }
    const event = (eventRows as any[])[0]

    // NEW FLOW: 
    // If slots are available -> Pending (for admin review)
    // If slots are 0 -> Waitlisted
    const newStatus = event.available_slots > 0 ? 'pending' : 'waitlisted'

    const conn = await getDb().getConnection()
    let finalRegistrationId: string | null = null
    let auditAction: 'registration.create' | 'registration.reconfirm' = 'registration.create'
    try {
      await conn.beginTransaction()
      const registrationId = (existing as any[]).length > 0 ? (existing as any[])[0].id : null

      if (registrationId) {
        auditAction = 'registration.reconfirm'
        await conn.execute(
          'UPDATE registrations SET status = ?, registered_at = CURRENT_TIMESTAMP WHERE id = ?',
          [newStatus, registrationId]
        )
        finalRegistrationId = String(registrationId)
      } else {
        const [insert] = await conn.execute(
          'INSERT INTO registrations (event_id, user_id, status) VALUES (?, ?, ?)',
          [eventId, payload.sub, newStatus]
        )
        finalRegistrationId = String((insert as any).insertId)
      }

      // We don't decrement available_slots here anymore, 
      // it should only happen when an admin confirms (pending -> confirmed)
      // to avoid people "hoarding" pending slots.

      await conn.commit()
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }

    // Get user information for email
    const [userRows] = await getDb().execute(
      'SELECT name, email FROM users WHERE id = ? LIMIT 1',
      [payload.sub]
    )
    
    const user = (userRows as any[])[0]
    
    // Send registration confirmation email to user
    if (user) {
      await sendEventRegistrationEmail(
        user.email,
        user.name,
        String(event.title),
        event.date,
        event.time,
        String(event.location),
        newStatus
      )
      
      // Send notification email to admin with status
      await sendRegistrationNotificationEmail(
        String(event.title),
        user.name,
        user.email,
        event.date,
        newStatus
      )
    }

    logUserAction({
      userId: payload.sub,
      action: auditAction,
      entityType: 'registration',
      entityId: finalRegistrationId,
      details: {
        eventId,
        eventTitle: String(event.title),
        eventDate: event.date,
        eventTime: event.time,
        eventLocation: String(event.location),
        status: newStatus,
      },
    })

    return NextResponse.json({ ok: true, status: newStatus })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Registration failed.' }, { status: 500 })
  }
}
