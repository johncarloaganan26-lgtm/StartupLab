import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'
import { authCookieName, verifyAuthToken } from '@/lib/auth'
import { logUserAction } from '@/lib/audit'

export const runtime = 'nodejs'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get(authCookieName)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = await verifyAuthToken(token)

  const conn = await getDb().getConnection()
  let eventInfo: null | {
    eventId: string
    eventTitle: string
    eventDate: unknown
    eventTime: unknown
    eventLocation: string
  } = null
  try {
    await conn.beginTransaction()
    const [rows] = await conn.execute(
      `SELECT r.status, r.event_id, e.title, e.date, e.time, e.location
       FROM registrations r
       JOIN events e ON e.id = r.event_id
       WHERE r.id = ? AND r.user_id = ?
       LIMIT 1
       FOR UPDATE`,
      [id, payload.sub]
    )
    if ((rows as any[]).length === 0) {
      await conn.rollback()
      return NextResponse.json({ error: 'Registration not found.' }, { status: 404 })
    }

    const row = (rows as any[])[0]
    const currentStatus = row.status
    eventInfo = {
      eventId: String(row.event_id),
      eventTitle: String(row.title),
      eventDate: row.date,
      eventTime: row.time,
      eventLocation: String(row.location),
    }

    // Only increment slots if they were actually taking one
    if (currentStatus === 'confirmed' || currentStatus === 'attended') {
      await conn.execute('UPDATE events SET available_slots = available_slots + 1 WHERE id = ?', [eventInfo.eventId])
    }

    await conn.execute('UPDATE registrations SET status = ? WHERE id = ?', ['cancelled', id])
    await conn.commit()

    logUserAction({
      userId: payload.sub,
      action: 'registration.cancel',
      entityType: 'registration',
      entityId: id,
      details: eventInfo,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    await conn.rollback()
    return NextResponse.json({ error: 'Cancel failed.' }, { status: 500 })
  } finally {
    conn.release()
  }
}
