import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'
import { authCookieName, verifyAuthToken } from '@/lib/auth'
import { safeJsonParse, summarizeAudit, targetForAudit, toneForAuditAction } from '@/lib/audit-presenter'

export const runtime = 'nodejs'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(authCookieName)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await verifyAuthToken(token)

  const [rows] = await getDb().execute(
    `SELECT
       al.id,
       al.action,
       al.entity_type,
       al.entity_id,
       al.details,
       al.created_at
     FROM audit_logs al
     WHERE al.admin_user_id = ?
     ORDER BY al.created_at DESC
     LIMIT 200`,
    [payload.sub]
  )

  const logs = (rows as any[]).map((row) => ({
    id: String(row.id),
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
}
