import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-auth'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await requireAdminAuth()
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [rows] = await getDb().execute(
      `SELECT id, title, description, date, time, location, total_slots, available_slots, image_url, status, deleted_at
       FROM events
       WHERE deleted_at IS NOT NULL
       ORDER BY deleted_at DESC`
    )

    const events = (rows as any[]).map((row) => ({
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
      deletedAt: row.deleted_at,
    }))

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Failed to fetch archived events:', error)
    return NextResponse.json({ error: 'Failed to fetch archived events' }, { status: 500 })
  }
}

