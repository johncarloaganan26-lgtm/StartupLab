import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { authCookieName, verifyAuthToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { logAdminAction } from '@/lib/audit'

export const runtime = 'nodejs'

function serialize(row: any) {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description,
    date: row.date,
    time: row.time,
    location: row.location,
    totalSlots: row.total_slots,
    availableSlots: row.available_slots,
    image: row.image_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function GET() {
  try {
    const [rows] = await getDb().execute(
      `SELECT id, title, description, date, time, location, total_slots, available_slots, image_url, status, created_at, updated_at
       FROM events
       WHERE deleted_at IS NULL
       ORDER BY date ASC, time ASC`
    )

    return NextResponse.json({ events: (rows as any[]).map(serialize) })
  } catch (error) {
    console.error('Get events error:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(authCookieName)?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyAuthToken(token)
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      title,
      description,
      date,
      time,
      location,
      totalSlots,
      availableSlots,
      image,
      status,
    } = body

    if (!title || !description || !date || !time || !location || !totalSlots) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const [result] = await getDb().execute(
      `INSERT INTO events (title, description, date, time, location, total_slots, available_slots, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        date,
        time,
        location,
        Number(totalSlots),
        Number(availableSlots ?? totalSlots),
        image ?? null,
        status ?? 'published',
      ]
    )

    const eventId = (result as { insertId: number }).insertId
    logAdminAction({
      adminUserId: payload.sub,
      action: 'event.create',
      entityType: 'event',
      entityId: eventId,
      details: { title },
    })
    return NextResponse.json({
      event: serialize({
        id: eventId,
        title,
        description,
        date,
        time,
        location,
        total_slots: Number(totalSlots),
        available_slots: Number(availableSlots ?? totalSlots),
        image_url: image ?? null,
        status: status ?? 'published',
      }),
    })
  } catch (err) {
    console.error('Create event failed', err)
    return NextResponse.json({ error: 'Failed to create event.' }, { status: 500 })
  }
}
