type JsonObject = Record<string, unknown>

export function safeJsonParse(text: string | null): unknown | null {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function asJsonObject(value: unknown): JsonObject | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as JsonObject
}

export type AuditTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export function toneForAuditAction(action: string): AuditTone {
  if (action.startsWith('auth.')) return 'info'
  if (action.endsWith('.create') || action === 'auth.signup') return 'success'
  if (action.includes('update') || action.includes('reconfirm')) return 'info'
  if (action.includes('restore')) return 'success'
  if (action.includes('archive') || action.includes('cancel')) return 'warning'
  if (action.includes('delete')) return 'danger'
  return 'neutral'
}

export function targetForAudit(input: {
  action: string
  entityType: string
  entityId: string | null
  detailsJson: unknown | null
}): string {
  const details = asJsonObject(input.detailsJson)

  const eventTitle =
    typeof details?.eventTitle === 'string' ? details.eventTitle.trim() : null
  const userEmail =
    typeof details?.userEmail === 'string' ? details.userEmail.trim() : null
  const userName =
    typeof details?.userName === 'string' ? details.userName.trim() : null
  const email = typeof details?.email === 'string' ? details.email.trim() : null

  if (eventTitle) return eventTitle
  if (userName && userEmail) return `${userName} <${userEmail}>`
  if (userEmail) return userEmail
  if (email) return email

  return input.entityType
}

export function summarizeAudit(input: {
  action: string
  entityType: string
  entityId: string | null
  detailsJson: unknown | null
}): string {
  const details = asJsonObject(input.detailsJson)
  const target = targetForAudit(input)

  switch (input.action) {
    case 'registration.create':
      return `Registered for ${target}`
    case 'registration.reconfirm':
      return `Re-registered for ${target}`
    case 'registration.cancel':
      return `Cancelled registration for ${target}`
    case 'registration.update_status':
      return `Updated registration status to ${String(details?.status ?? 'unknown')} (${target})`
    case 'event.create':
      return `Created event ${target}`
    case 'event.update': {
      const updates = Array.isArray(details?.updates) ? (details?.updates as unknown[]) : []
      const fields = updates.filter((u) => typeof u === 'string').join(', ')
      return fields
        ? `Updated event (${target}) [${fields}]`
        : `Updated event (${target})`
    }
    case 'event.archive':
      return `Archived event (${target})`
    case 'event.restore':
      return `Restored event (${target})`
    case 'event.delete_permanent':
      return `Deleted event permanently (${target})`
    case 'auth.login':
      return `Logged in (${target})`
    case 'auth.logout':
      return `Logged out (${target})`
    case 'auth.signup':
      return `Signed up (${target})`
    case 'profile.update':
      return `Updated profile (${target})`
    default:
      return `${input.action} (${target})`.trim()
  }
}
