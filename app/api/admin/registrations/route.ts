import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'
import { authCookieName, verifyAuthToken } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(authCookieName)?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await verifyAuthToken(token)
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [rows] = await getDb().execute(
      `SELECT 
         r.id,
         r.event_id,
         r.user_id,
         r.status,
         r.registered_at,
         u.name AS user_name,
         u.email AS user_email,
         e.title AS event_title,
         e.date AS event_date,
         e.time AS event_time,
         e.location AS event_location
       FROM registrations r
       JOIN users u ON u.id = r.user_id
       JOIN events e ON e.id = r.event_id
       ORDER BY r.registered_at DESC`
    )

    const labelMap: Record<string, string> = {
      pending: 'Pending',
      confirmed: 'Approved',
      attended: 'Attended',
      cancelled: 'Cancelled',
      waitlisted: 'Waitlisted',
      'no-show': 'No Show',
      rejected: 'Rejected',
    }

    const registrations = (rows as any[]).map((row) => ({
      id: String(row.id),
      eventId: String(row.event_id),
      userId: String(row.user_id),
      status: row.status,
      statusLabel: labelMap[row.status] || row.status,
      registeredAt: row.registered_at,
      userName: row.user_name,
      userEmail: row.user_email,
      eventTitle: row.event_title,
      eventDate: row.event_date,
      eventTime: row.event_time,
      eventLocation: row.event_location,
    }))

    return NextResponse.json({ registrations })
  } catch (error) {
    console.error('Get registrations error:', error)
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 })
  }
}
