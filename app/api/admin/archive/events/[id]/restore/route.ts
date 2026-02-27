import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit'

export const runtime = 'nodejs'

export async function POST(
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

  const [result] = await getDb().execute(
    'UPDATE events SET deleted_at = NULL, deleted_by = NULL WHERE id = ? AND deleted_at IS NOT NULL',
    [id]
  )

  if ((result as any).affectedRows === 0) {
    return NextResponse.json({ error: 'Event not found or already restored' }, { status: 404 })
  }

  logAdminAction({
    adminUserId: payload.sub,
    action: 'event.restore',
    entityType: 'event',
    entityId: id,
    details: { eventTitle: existingTitle ?? 'Unknown event' },
  })

  return NextResponse.json({ ok: true })
}
