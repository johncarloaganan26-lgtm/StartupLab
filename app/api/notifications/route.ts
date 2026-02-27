import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'
import { authCookieName, verifyAuthToken } from '@/lib/auth'

export const runtime = 'nodejs'

async function queryWithRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let attempt = 0
  // Exponential backoff 100ms, 250ms
  const waits = [100, 250]
  while (true) {
    try {
      return await fn()
    } catch (err: any) {
      if (attempt >= retries) throw err
      // only retry for transient connection errors
      const code = err?.code || err?.errno
      if (!['ECONNRESET', 'PROTOCOL_CONNECTION_LOST', 'ER_CON_COUNT_ERROR'].includes(code)) {
        throw err
      }
      await new Promise(res => setTimeout(res, waits[attempt] ?? 250))
      attempt++
    }
  }
}

// GET notifications for current user
export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(authCookieName)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await verifyAuthToken(token)

  try {
    const [rows] = await queryWithRetry(() =>
      getDb().execute(
        `SELECT id, user_id, title, message, type, is_read, created_at
         FROM notifications
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 50`,
        [payload.sub]
      )
    )

    return NextResponse.json({ notifications: rows })
  } catch (err) {
    console.error('Error fetching notifications:', err)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// POST - Mark notification as read
export async function POST(req: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get(authCookieName)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await verifyAuthToken(token)
  const body = await req.json()
  const { notificationId, markAllRead } = body

  try {
    if (markAllRead) {
      await queryWithRetry(() =>
        getDb().execute(
          'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
          [payload.sub]
        )
      )
    } else if (notificationId) {
      await queryWithRetry(() =>
        getDb().execute(
          'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
          [notificationId, payload.sub]
        )
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error marking notification as read:', err)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}
