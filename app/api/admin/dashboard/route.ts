import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-auth'

export const runtime = 'nodejs'

export async function GET() {
    try {
        await requireAdminAuth()
        const [trendRows] = await getDb().execute(
            `SELECT
                DATE_FORMAT(registered_at, '%Y-%m') AS month_key,
                DATE_FORMAT(registered_at, '%b') AS month_label,
                COUNT(*) AS registrations
            FROM registrations
            WHERE registered_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY month_key, month_label
            ORDER BY month_key ASC`
        )
        const [eventTrendRows] = await getDb().execute(
            `SELECT
                DATE_FORMAT(created_at, '%Y-%m') AS month_key,
                DATE_FORMAT(created_at, '%b') AS month_label,
                COUNT(*) AS events
            FROM events
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                AND deleted_at IS NULL
            GROUP BY month_key, month_label
            ORDER BY month_key ASC`
        )
        const [currentMonthRegs] = await getDb().execute(
            `SELECT COUNT(*) AS count FROM registrations
            WHERE MONTH(registered_at) = MONTH(CURDATE()) AND YEAR(registered_at) = YEAR(CURDATE())`
        )
        const [prevMonthRegs] = await getDb().execute(
            `SELECT COUNT(*) AS count FROM registrations
            WHERE MONTH(registered_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
                AND YEAR(registered_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))`
        )
        const [currentMonthEvents] = await getDb().execute(
            `SELECT COUNT(*) AS count FROM events
            WHERE deleted_at IS NULL
                AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())`
        )
        const [prevMonthEvents] = await getDb().execute(
            `SELECT COUNT(*) AS count FROM events
            WHERE deleted_at IS NULL
                AND MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
                AND YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))`
        )
        const curRegs = Number((currentMonthRegs as any[])[0]?.count ?? 0)
        const prvRegs = Number((prevMonthRegs as any[])[0]?.count ?? 0)
        const curEvents = Number((currentMonthEvents as any[])[0]?.count ?? 0)
        const prvEvents = Number((prevMonthEvents as any[])[0]?.count ?? 0)
        const regGrowth = prvRegs > 0 ? Math.round(((curRegs - prvRegs) / prvRegs) * 100) : (curRegs > 0 ? 100 : 0)
        const eventGrowth = prvEvents > 0 ? Math.round(((curEvents - prvEvents) / prvEvents) * 100) : (curEvents > 0 ? 100 : 0)
        const [activeUsersRows] = await getDb().execute(
            `SELECT COUNT(DISTINCT user_id) AS count FROM registrations
            WHERE registered_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`
        )
        const [prevActiveUsersRows] = await getDb().execute(
            `SELECT COUNT(DISTINCT user_id) AS count FROM registrations
            WHERE registered_at >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
                AND registered_at < DATE_SUB(CURDATE(), INTERVAL 30 DAY)`
        )
        const curActive = Number((activeUsersRows as any[])[0]?.count ?? 0)
        const prvActive = Number((prevActiveUsersRows as any[])[0]?.count ?? 0)
        const activeGrowth = prvActive > 0 ? Math.round(((curActive - prvActive) / prvActive) * 100) : (curActive > 0 ? 100 : 0)
        const [recentRows] = await getDb().execute(
            `SELECT r.id, r.status, r.registered_at,
                u.name AS user_name, u.email AS user_email,
                e.title AS event_title
            FROM registrations r
            JOIN users u ON u.id = r.user_id
            JOIN events e ON e.id = r.event_id
            ORDER BY r.registered_at DESC
            LIMIT 5`
        )
        const [auditRows] = await getDb().execute(
            `SELECT id, action, entity_type, entity_id, admin_user_id, details, created_at
            FROM audit_logs
            ORDER BY created_at DESC
            LIMIT 10`
        )
        const registrationTrend = (trendRows as any[]).map(row => ({
            name: String(row.month_label),
            registrations: Number(row.registrations)
        }))
        const eventTrendMap = new Map<string, number>()
        ;(eventTrendRows as any[]).forEach(row => {
            eventTrendMap.set(String(row.month_label), Number(row.events))
        })
        const monthlyTrend = registrationTrend.map(item => ({
            ...item,
            events: eventTrendMap.get(item.name) ?? 0
        }))
        const recentRegistrations = (recentRows as any[]).map(row => ({
            id: String(row.id),
            status: row.status,
            registeredAt: row.registered_at,
            userName: String(row.user_name),
            userEmail: String(row.user_email),
            eventTitle: String(row.event_title)
        }))
        const recentAuditLogs = (auditRows as any[]).map(row => ({
            id: String(row.id),
            action: row.action,
            entityType: row.entity_type,
            entityId: String(row.entity_id),
            adminUserId: String(row.admin_user_id),
            details: row.details,
            createdAt: row.created_at
        }))
        return NextResponse.json({
            registrationTrend, monthlyTrend,
            growth: { events: eventGrowth, registrations: regGrowth, activeUsers: activeGrowth },
            recentRegistrations, recentAuditLogs
        })
    } catch (error) {
        if (error instanceof NextResponse) return error
        console.error('Dashboard error:', error)
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
    }
}
