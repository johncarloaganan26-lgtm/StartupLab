import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
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
      await conn.beginTransaction()
      await ensureArchivedUsersTable(conn)

      const [rows] = await conn.execute(
        `SELECT
           id,
           user_id,
           name,
           email,
           password_hash,
           role,
           company,
           phone,
           bio
         FROM archived_users
         WHERE id IN (${placeholders})
         ORDER BY id ASC`,
        ids
      )

      const archivedRows = rows as any[]
      let restored = 0
      const skipped: Array<{ id: string; reason: string }> = []

      for (const row of archivedRows) {
        const archiveId = String(row.id)
        const userId = row.user_id
        const email = String(row.email)

        const [idRows] = await conn.execute('SELECT id FROM users WHERE id = ? LIMIT 1', [userId])
        if ((idRows as any[]).length > 0) {
          skipped.push({ id: archiveId, reason: 'user_id_exists' })
          continue
        }

        const [emailRows] = await conn.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email])
        if ((emailRows as any[]).length > 0) {
          skipped.push({ id: archiveId, reason: 'email_exists' })
          continue
        }

        const passwordHash =
          typeof row.password_hash === 'string' && row.password_hash.length > 0
            ? row.password_hash
            : await bcrypt.hash('TemporaryPassword123!', 10)

        await conn.execute(
          `INSERT INTO users (id, name, email, password_hash, role, company, phone, bio)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            row.name,
            email,
            passwordHash,
            row.role || 'attendee',
            row.company ?? null,
            row.phone ?? null,
            row.bio ?? null,
          ]
        )

        await conn.execute('DELETE FROM archived_users WHERE id = ?', [row.id])
        restored += 1
      }

      await conn.commit()

      logAdminAction({
        adminUserId: admin.sub,
        action: 'user.archive_bulk_restore',
        entityType: 'archived_user',
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
    console.error('Bulk restore archived users failed:', err)
    return NextResponse.json({ error: 'Failed to restore archived users' }, { status: 500 })
  }
}
