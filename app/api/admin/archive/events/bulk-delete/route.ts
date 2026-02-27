import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit'
import { archiveRegistrationsByEventIds } from '@/lib/registration-archive'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const payload = await requireAdminAuth()
  
  const body = await req.json()
  const { ids } = body
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
  }

  const placeholders = ids.map(() => '?').join(',')
  const conn = await getDb().getConnection()
  
  try {
    await conn.beginTransaction()

    // Get event titles for logging
    const [eventRows] = await conn.execute(
      `SELECT id, title FROM events WHERE id IN (${placeholders})`,
      ids
    )
    const events = (eventRows as any[]).map(row => ({
      id: String(row.id),
      title: row.title
    }))

    // Archive registrations first, then remove from active table.
    await archiveRegistrationsByEventIds(conn, ids, payload.sub, 'event.bulk_delete_permanent')
    await conn.execute(`DELETE FROM registrations WHERE event_id IN (${placeholders})`, ids)

    // Delete events
    await conn.execute(
      `DELETE FROM events WHERE id IN (${placeholders})`,
      ids
    )

    await conn.commit()

    // Log each deletion
    for (const event of events) {
      logAdminAction({
        adminUserId: payload.sub,
        action: 'event.delete_permanent',
        entityType: 'event',
        entityId: event.id,
        details: { eventTitle: event.title },
      })
    }

    return NextResponse.json({ ok: true, deleted: ids.length })
  } catch (err) {
    await conn.rollback()
    return NextResponse.json({ error: 'Bulk delete failed.' }, { status: 500 })
  } finally {
    conn.release()
  }
}
