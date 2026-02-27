import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit'
import { archiveRegistrationsByEventIds } from '@/lib/registration-archive'

export const runtime = 'nodejs'

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await requireAdminAuth()
  const { id } = await params

  const [existingRows] = await getDb().execute(
    'SELECT title FROM events WHERE id = ? LIMIT 1',
    [id]
  )
  const existingTitle =
    (existingRows as any[]).length > 0 ? String((existingRows as any[])[0].title) : null

  await getDb().execute(
    'UPDATE events SET deleted_at = NULL, deleted_by = NULL WHERE id = ? AND deleted_at IS NOT NULL',
    [id]
  )

  logAdminAction({
    adminUserId: payload.sub,
    action: 'event.restore',
    entityType: 'event',
    entityId: id,
    details: { eventTitle: existingTitle ?? 'Unknown event' },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await requireAdminAuth()
  const { id } = await params

  const [existingRows] = await getDb().execute(
    'SELECT title FROM events WHERE id = ? LIMIT 1',
    [id]
  )
  const existingTitle =
    (existingRows as any[]).length > 0 ? String((existingRows as any[])[0].title) : null

  const conn = await getDb().getConnection()
  try {
    await conn.beginTransaction()
    await archiveRegistrationsByEventIds(conn, [id], payload.sub, 'event.delete_permanent')
    await conn.execute('DELETE FROM registrations WHERE event_id = ?', [id])
    await conn.execute('DELETE FROM events WHERE id = ?', [id])
    await conn.commit()
  } catch (err) {
    await conn.rollback()
    return NextResponse.json({ error: 'Permanent delete failed.' }, { status: 500 })
  } finally {
    conn.release()
  }

  logAdminAction({
    adminUserId: payload.sub,
    action: 'event.delete_permanent',
    entityType: 'event',
    entityId: id,
    details: { eventTitle: existingTitle ?? 'Unknown event' },
  })

  return NextResponse.json({ ok: true })
}
