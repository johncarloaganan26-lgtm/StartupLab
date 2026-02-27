import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'
import { authCookieName, verifyAuthToken } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(authCookieName)?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await verifyAuthToken(token)
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [eventRows] = await getDb().execute('SELECT COUNT(*) AS total_events FROM events WHERE deleted_at IS NULL')
    const [registrationRows] = await getDb().execute(
      'SELECT status, COUNT(*) as count FROM registrations GROUP BY status'
    )
    const [capacityRows] = await getDb().execute(
      'SELECT SUM(total_slots) as total_capacity, SUM(total_slots - available_slots) as filled FROM events WHERE deleted_at IS NULL'
    )
    const totalEvents = Number((eventRows as any[])[0]?.total_events ?? 0)
    const capacity = (capacityRows as any[])[0]
    const totalCapacity = Number(capacity?.total_capacity ?? 0)
    const filled = Number(capacity?.filled ?? 0)
    const statusDistribution: Record<string, number> = {}
    ;(registrationRows as any[]).forEach((row) => {
      statusDistribution[row.status] = Number(row.count)
    })

    return NextResponse.json({
      totalEvents,
      totalRegistrations: (registrationRows as any[]).reduce((sum, row) => sum + Number(row.count), 0),
      capacityUsage: totalCapacity ? Math.round((filled / totalCapacity) * 100) : 0,
      statusDistribution,
    })
  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
