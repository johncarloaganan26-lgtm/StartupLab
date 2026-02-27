import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-auth'
import { ensureArchivedUsersTable } from '@/lib/user-archive'

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
      await ensureArchivedUsersTable(conn)
      const [rows] = await conn.execute(
        `SELECT
           id,
           user_id,
           name,
           email,
           role,
           company,
           phone,
           bio,
           created_at_original,
           deleted_at,
           deleted_by,
           deletion_source
         FROM archived_users
         ORDER BY deleted_at DESC`
      )

      const users = (rows as any[]).map((row) => ({
        id: String(row.id),
        userId: String(row.user_id),
        name: row.name,
        email: row.email,
        role: row.role,
        company: row.company,
        phone: row.phone,
        bio: row.bio,
        createdAtOriginal: row.created_at_original,
        deletedAt: row.deleted_at,
        deletedBy: row.deleted_by != null ? String(row.deleted_by) : null,
        deletionSource: row.deletion_source,
      }))

      return NextResponse.json({ users })
    } finally {
      conn.release()
    }
  } catch (error) {
    console.error('Failed to fetch archived users:', error)
    return NextResponse.json({ error: 'Failed to fetch archived users' }, { status: 500 })
  }
}
