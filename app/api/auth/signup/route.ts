import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise'
import { getDb } from '@/lib/db'
import { authCookieName, authCookieOptions, signAuthToken } from '@/lib/auth'
import { logActorAction } from '@/lib/audit'

export const runtime = 'nodejs'

const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = String(body?.name ?? '').trim()
    const email = String(body?.email ?? '').trim().toLowerCase()
    const password = String(body?.password ?? '')

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 })
    }

    if (!passwordPolicy.test(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters and include upper, lower, number, and special character.' },
        { status: 400 }
      )
    }

    const [existing] = await getDb().execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    )
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const [result] = await getDb().execute<ResultSetHeader>(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, 'attendee']
    )

    const user = {
      id: String(result.insertId),
      name,
      email,
      role: 'attendee' as const,
    }

    const token = await signAuthToken({ sub: user.id, role: user.role })
    const res = NextResponse.json({ user })
    res.cookies.set(authCookieName, token, authCookieOptions())

    logActorAction({
      userId: user.id,
      userRole: user.role,
      action: 'auth.signup',
      entityType: 'user',
      entityId: user.id,
      details: { email: user.email, name: user.name },
    })

    return res
  } catch (err) {
    console.error('Signup failed', err)
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

    const body: { error: string; details?: string } = { error: 'Signup failed.' }
    if (process.env.NODE_ENV !== 'production') {
      body.details = details
    }
    return NextResponse.json(body, { status: 500 })
  }
}
