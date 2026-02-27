import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'
import { authCookieName, verifyAuthToken } from '@/lib/auth'

export const runtime = 'nodejs'

// GET notifications for current user
export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(authCookieName)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await verifyAuthToken(token)

  try {
    const [rows] = await getDb().execute(
      `SELECT id, user_id, title, message, type, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [payload.sub]
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
      await getDb().execute(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
        [payload.sub]
      )
    } else if (notificationId) {
      await getDb().execute(
        'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
        [notificationId, payload.sub]
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error marking notification as read:', err)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}
