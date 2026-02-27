import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit'
import { ensureArchivedUsersTable } from '@/lib/user-archive'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const admin = await requireAdminAuth()
    const body = await req.json()
    const ids = Array.isArray(body?.ids) ? body.ids : []

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    const placeholders = ids.map(() => '?').join(',')
    const conn = await getDb().getConnection()
    try {
      await ensureArchivedUsersTable(conn)
      const [result] = await conn.execute(
        `DELETE FROM archived_users WHERE id IN (${placeholders})`,
        ids
      )

      logAdminAction({
        adminUserId: admin.sub,
        action: 'user.archive_bulk_delete',
        entityType: 'archived_user',
        entityId: 'bulk',
        details: { ids, deleted: (result as any).affectedRows ?? 0 },
      })

      return NextResponse.json({ ok: true, deleted: (result as any).affectedRows ?? 0 })
    } finally {
      conn.release()
    }
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('Bulk delete archived users failed:', err)
    return NextResponse.json({ error: 'Failed to delete archived users' }, { status: 500 })
  }
}
