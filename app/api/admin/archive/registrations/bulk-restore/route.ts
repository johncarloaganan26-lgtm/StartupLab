import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit'
import { ensureArchivedRegistrationsTable } from '@/lib/registration-archive'

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
      await conn.beginTransaction()
      await ensureArchivedRegistrationsTable(conn)

      const [rows] = await conn.execute(
        `SELECT id, event_id, user_id, status, registered_at
         FROM archived_registrations
         WHERE id IN (${placeholders})
         ORDER BY id ASC`,
        ids
      )

      const archivedRows = rows as any[]
      let restored = 0
      const skipped: Array<{ id: string; reason: string }> = []

      for (const row of archivedRows) {
        const archiveId = String(row.id)
        const eventId = row.event_id
        const userId = row.user_id

        const [eventRows] = await conn.execute(
          'SELECT id FROM events WHERE id = ? AND deleted_at IS NULL LIMIT 1',
          [eventId]
        )
        if ((eventRows as any[]).length === 0) {
          skipped.push({ id: archiveId, reason: 'event_missing_or_archived' })
          continue
        }

        const [userRows] = await conn.execute('SELECT id FROM users WHERE id = ? LIMIT 1', [userId])
        if ((userRows as any[]).length === 0) {
          skipped.push({ id: archiveId, reason: 'user_missing' })
          continue
        }

        const [existingRows] = await conn.execute(
          'SELECT id FROM registrations WHERE event_id = ? AND user_id = ? LIMIT 1',
          [eventId, userId]
        )
        if ((existingRows as any[]).length > 0) {
          skipped.push({ id: archiveId, reason: 'already_exists' })
          continue
        }

        await conn.execute(
          'INSERT INTO registrations (event_id, user_id, status, registered_at) VALUES (?, ?, ?, ?)',
          [eventId, userId, row.status, row.registered_at]
        )
        await conn.execute('DELETE FROM archived_registrations WHERE id = ?', [row.id])
        restored += 1
      }

      await conn.commit()

      logAdminAction({
        adminUserId: admin.sub,
        action: 'registration.archive_bulk_restore',
        entityType: 'archived_registration',
        entityId: 'bulk',
        details: { requested: ids.length, restored, skipped },
      })

      return NextResponse.json({
        ok: true,
        requested: ids.length,
        restored,
        skippedCount: skipped.length,
        skipped,
      })
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('Bulk restore archived registrations failed:', err)
    return NextResponse.json({ error: 'Failed to restore archived registrations' }, { status: 500 })
  }
}
