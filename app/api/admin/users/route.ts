import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { RowDataPacket } from 'mysql2/promise'
import { getDb } from '@/lib/db'
import { authCookieName, verifyAuthToken } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(authCookieName)?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyAuthToken(token)
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [rows] = await getDb().execute<RowDataPacket[]>(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        MAX(r.registered_at) AS last_registered,
        COUNT(r.id) AS event_count
       FROM users u
       LEFT JOIN registrations r ON r.user_id = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    )

    const users = rows.map((row) => ({
      id: String(row.id),
      name: String(row.name ?? ''),
      email: String(row.email ?? ''),
      role: row.role === 'admin' ? 'admin' : 'attendee',
      lastRegistered: row.last_registered ? String(row.last_registered) : null,
      eventCount: Number(row.event_count ?? 0),
    }))

    return NextResponse.json({ users })
  } catch (err) {
    console.error('Admin users fetch failed', err)
    return NextResponse.json({ error: 'Failed to load users.' }, { status: 500 })
  }
}
