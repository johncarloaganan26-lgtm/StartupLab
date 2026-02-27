import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-auth'
import { safeJsonParse, summarizeAudit, targetForAudit, toneForAuditAction } from '@/lib/audit-presenter'

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
      `SELECT
         al.id,
         al.admin_user_id,
         al.action,
         al.entity_type,
         al.entity_id,
         al.details,
         al.created_at,
         u.name AS admin_name,
         u.email AS admin_email
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.admin_user_id
       ORDER BY al.created_at DESC
       LIMIT 200`
    )

    const logs = (rows as any[]).map((row) => ({
      id: String(row.id),
      adminUserId: String(row.admin_user_id),
      adminName: row.admin_name ? String(row.admin_name) : null,
      adminEmail: row.admin_email ? String(row.admin_email) : null,
      action: String(row.action),
      entityType: String(row.entity_type),
      entityId: row.entity_id ? String(row.entity_id) : null,
      details: row.details ? String(row.details) : null,
      createdAt: row.created_at,
    }))
      .map((log) => {
        const detailsJson = safeJsonParse(log.details)
        return {
          ...log,
          detailsJson,
          summary: summarizeAudit({
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            detailsJson,
          }),
          target: targetForAudit({
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            detailsJson,
          }),
          tone: toneForAuditAction(log.action),
        }
      })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}
