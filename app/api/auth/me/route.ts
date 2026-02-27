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
    const userId = payload.sub

    const [rows] = await getDb().execute<RowDataPacket[]>(
      'SELECT id, name, email, role, company, phone, bio, created_at FROM users WHERE id = ? LIMIT 1',
      [userId]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRow = rows[0]

    const user = {
      id: String(userRow.id),
      name: String(userRow.name),
      email: String(userRow.email),
      role: userRow.role as 'attendee' | 'admin',
      company: userRow.company ? String(userRow.company) : '',
      phone: userRow.phone ? String(userRow.phone) : '',
      bio: userRow.bio ? String(userRow.bio) : '',
      createdAt: userRow.created_at ? String(userRow.created_at) : null,
    }

    return NextResponse.json({ user })
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
