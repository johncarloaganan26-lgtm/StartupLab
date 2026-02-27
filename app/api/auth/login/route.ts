import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import type { RowDataPacket } from 'mysql2/promise'
import { getDb } from '@/lib/db'
import { authCookieName, authCookieOptions, signAuthToken } from '@/lib/auth'
import { logActorAction } from '@/lib/audit'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = String(body?.email ?? '').trim().toLowerCase()
    const password = String(body?.password ?? '')

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const [rows] = await getDb().execute<RowDataPacket[]>(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = ? LIMIT 1',
      [email]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
    }

    const userRow = rows[0] as {
      id: number
      name: string
      email: string
      password_hash: string
      role: 'attendee' | 'admin'
    }

    const isValid = await bcrypt.compare(password, userRow.password_hash)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
    }

    const user = {
      id: String(userRow.id),
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
    }

    const token = await signAuthToken({ sub: user.id, role: user.role })
    const res = NextResponse.json({ user })
    res.cookies.set(authCookieName, token, authCookieOptions())

    logActorAction({
      userId: user.id,
      userRole: user.role,
      action: 'auth.login',
      entityType: 'user',
      entityId: user.id,
      details: { email: user.email, name: user.name },
    })

    return res
  } catch (err) {
    console.error('Login failed', err)
    const code = (err as { code?: string })?.code
    const friendly =
      code === 'ER_ACCESS_DENIED_ERROR'
        ? 'Database access denied.'
        : code === 'ER_BAD_DB_ERROR'
        ? 'Database not found.'
        : code === 'ER_NO_SUCH_TABLE'
        ? 'Database table missing.'
        : undefined
    const details =
      friendly ?? (err instanceof Error ? err.message : 'Unknown error')

    const body: { error: string; details?: string } = { error: 'Login failed.' }
    if (process.env.NODE_ENV !== 'production') {
      body.details = details
    }
    return NextResponse.json(body, { status: 500 })
  }
}
