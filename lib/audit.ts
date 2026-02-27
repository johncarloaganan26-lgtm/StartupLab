import { getDb } from '@/lib/db'

type AuditLogInput = {
  userId: string
  userRole: 'admin' | 'attendee'
  action: string
  entityType: string
  entityId?: string | number | null
  details?: unknown
}

async function insertAuditLog(input: AuditLogInput) {
  try {
    const entityId =
      input.entityId === undefined || input.entityId === null
        ? null
        : String(input.entityId)

    const isPlainObject =
      input.details !== null &&
      typeof input.details === 'object' &&
      !Array.isArray(input.details)

    const details =
      input.details === undefined
        ? JSON.stringify({ actorRole: input.userRole })
        : JSON.stringify(
            isPlainObject
              ? { actorRole: input.userRole, ...(input.details as Record<string, unknown>) }
              : { actorRole: input.userRole, value: input.details }
          )

    await getDb().execute(
      `INSERT INTO audit_logs (admin_user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [input.userId, input.action, input.entityType, entityId, details]
    )
  } catch (err) {
    // Audit logging should never break the main admin action.
    console.error('Audit log insert failed', err)
  }
}

export async function logAdminAction(input: {
  adminUserId: string
  action: string
  entityType: string
  entityId?: string | number | null
  details?: unknown
}) {
  return logActorAction({
    userId: input.adminUserId,
    userRole: 'admin',
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    details: input.details,
  })
}

export async function logUserAction(input: {
  userId: string
  action: string
  entityType: string
  entityId?: string | number | null
  details?: unknown
}) {
  return logActorAction({
    userId: input.userId,
    userRole: 'attendee',
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    details: input.details,
  })
}

export async function logActorAction(input: AuditLogInput) {
  return insertAuditLog(input)
}
