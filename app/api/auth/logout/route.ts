import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { authCookieName, authCookieOptions, verifyAuthToken } from '@/lib/auth'
import { logActorAction } from '@/lib/audit'
import type { AuthTokenPayload } from '@/lib/auth'
import { getDb } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get(authCookieName)?.value
  if (token) {
    try {
      const payload = (await verifyAuthToken(token)) as AuthTokenPayload
      const [rows] = await getDb().execute(
        'SELECT name, email FROM users WHERE id = ? LIMIT 1',
        [payload.sub]
      )
      const userRow = (rows as any[]).length > 0 ? (rows as any[])[0] : null
      logActorAction({
        userId: payload.sub,
        userRole: payload.role,
        action: 'auth.logout',
        entityType: 'user',
        entityId: payload.sub,
        details: userRow
          ? { email: String(userRow.email), name: String(userRow.name) }
          : undefined,
      })
    } catch {
      // ignore
    }
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(authCookieName, '', {
    ...authCookieOptions(),
    maxAge: 0,
  })
  return res
}
