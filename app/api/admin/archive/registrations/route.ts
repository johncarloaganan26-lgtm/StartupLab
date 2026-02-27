import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-auth'
import { ensureArchivedRegistrationsTable } from '@/lib/registration-archive'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await requireAdminAuth()
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const conn = await getDb().getConnection()
    try {
      await ensureArchivedRegistrationsTable(conn)
      const [rows] = await conn.execute(
      `SELECT
         id,
         registration_id,
         event_id,
         user_id,
         status,
         registered_at,
         user_name,
         user_email,
         event_title,
         event_date,
         event_time,
         event_location,
         deleted_at,
         deleted_by,
         deletion_source
       FROM archived_registrations
       ORDER BY deleted_at DESC`
      )

      const registrations = (rows as any[]).map((row) => ({
        id: String(row.id),
        registrationId: row.registration_id != null ? String(row.registration_id) : null,
        eventId: String(row.event_id),
        userId: String(row.user_id),
        status: row.status,
        registeredAt: row.registered_at,
        userName: row.user_name,
        userEmail: row.user_email,
        eventTitle: row.event_title,
        eventDate: row.event_date,
        eventTime: row.event_time,
        eventLocation: row.event_location,
        deletedAt: row.deleted_at,
        deletedBy: row.deleted_by != null ? String(row.deleted_by) : null,
        deletionSource: row.deletion_source,
      }))

      return NextResponse.json({ registrations })
    } finally {
      conn.release()
    }
  } catch (error) {
    console.error('Failed to fetch archived registrations:', error)
    return NextResponse.json({ error: 'Failed to fetch archived registrations' }, { status: 500 })
  }
}
