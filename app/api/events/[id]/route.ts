import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'
import { authCookieName, verifyAuthToken } from '@/lib/auth'
import { logAdminAction } from '@/lib/audit'
import * as z from 'zod'

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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const [rows] = await getDb().execute(
      `SELECT id, title, description, date, time, location, total_slots, available_slots, image_url, status, created_at, updated_at
       FROM events
       WHERE id = ? AND deleted_at IS NULL
       LIMIT 1`,
      [id]
    )
    const row = (rows as any[])[0]
    if (!row) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    return NextResponse.json({ event: serialize(row) })
  } catch (err) {
    console.error('Get event failed', err)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get(authCookieName)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await verifyAuthToken(token)
  if (payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const schema = z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    date: z.string().min(1).optional(),
    time: z.string().min(1).optional(),
    location: z.string().min(3).optional(),
    totalSlots: z.number().int().min(1).optional(),
    availableSlots: z.number().int().min(0).optional(),
    image: z.string().url().optional().or(z.literal('')).optional(),
    status: z.enum(['draft', 'published', 'completed', 'cancelled']).optional(),
  })
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  const body = parsed.data

  const conn = await getDb().getConnection()
  try {
    // Load existing event
    const [rows] = await conn.execute(
      'SELECT id, title, description, date, time, location, total_slots, available_slots, image_url, status FROM events WHERE id = ? AND deleted_at IS NULL',
      [id]
    )
    const current = (rows as any[])[0]
    if (!current) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const next = {
      title: body.title ?? current.title,
      description: body.description ?? current.description,
      date: body.date ?? current.date,
      time: body.time ?? current.time,
      location: body.location ?? current.location,
      total_slots: body.totalSlots ?? current.total_slots,
      available_slots: body.availableSlots ?? current.available_slots,
      image_url: body.image ?? current.image_url,
      status: body.status ?? current.status,
    }

    // Guard: available_slots cannot exceed total_slots
    if (Number(next.available_slots) > Number(next.total_slots)) {
      next.available_slots = next.total_slots
    }

    await conn.execute(
      `UPDATE events
         SET title = ?, description = ?, date = ?, time = ?, location = ?,
             total_slots = ?, available_slots = ?, image_url = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        next.title,
        next.description,
        next.date,
        next.time,
        next.location,
        Number(next.total_slots),
        Number(next.available_slots),
        next.image_url,
        next.status,
        id,
      ]
    )

    logAdminAction({
      adminUserId: payload.sub,
      action: 'event.update',
      entityType: 'event',
      entityId: id,
      details: { title: next.title },
    })

    return NextResponse.json({
      event: {
        id: String(id),
        title: next.title,
        description: next.description,
        date: next.date,
        time: next.time,
        location: next.location,
        totalSlots: Number(next.total_slots),
        availableSlots: Number(next.available_slots),
        image: next.image_url,
        status: next.status,
      },
    })
  } catch (err: any) {
    console.error('Update event failed', err)
    return NextResponse.json({ error: err.message || 'Failed to update event.' }, { status: 500 })
  } finally {
    conn.release()
  }
}
