import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [rows] = await getDb().execute(
      'SELECT id, title, description, date, time, location, total_slots, available_slots, image_url, status FROM events WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [id]
    )

    const results = rows as any[]
    if (!results.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const row = results[0] as any
    return NextResponse.json({
      event: {
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
      },
    })
  } catch (error) {
    console.error('Get event error:', error)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await requireAdminAuth()

    const body = await req.json()

    const [existingRows] = await getDb().execute(
      'SELECT title FROM events WHERE id = ? LIMIT 1',
      [id]
    )
    const existingTitle =
      (existingRows as any[]).length > 0 ? String((existingRows as any[])[0].title) : null

    const mapping: Record<string, string> = {
      title: 'title',
      description: 'description',
      date: 'date',
      time: 'time',
      location: 'location',
      status: 'status',
      totalSlots: 'total_slots',
      availableSlots: 'available_slots',
      image: 'image_url',
    }
    const updates: string[] = []
    const values: any[] = []

    for (const key of Object.keys(mapping)) {
      if (body[key] !== undefined) {
        updates.push(`${mapping[key]} = ?`)
        values.push(body[key])
      }
    }

    if (!updates.length) {
      return NextResponse.json({ error: 'No changes provided.' }, { status: 400 })
    }

    values.push(id)
    await getDb().execute(
      `UPDATE events SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      values
    )

    logAdminAction({
      adminUserId: payload.sub,
      action: 'event.update',
      entityType: 'event',
      entityId: id,
      details: {
        eventTitle: String(body?.title ?? existingTitle ?? 'Unknown event'),
        updates: Object.keys(body ?? {}),
      },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error('Update event error:', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await requireAdminAuth()

    const [existingRows] = await getDb().execute(
      'SELECT title FROM events WHERE id = ? LIMIT 1',
      [id]
    )
    const existingTitle =
      (existingRows as any[]).length > 0 ? String((existingRows as any[])[0].title) : null

    await getDb().execute(
      'UPDATE events SET deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE id = ? AND deleted_at IS NULL',
      [payload.sub, id]
    )

    logAdminAction({
      adminUserId: payload.sub,
      action: 'event.archive',
      entityType: 'event',
      entityId: id,
      details: { eventTitle: existingTitle ?? 'Unknown event' },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error('Delete event error:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
