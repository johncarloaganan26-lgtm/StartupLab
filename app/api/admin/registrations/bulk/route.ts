import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'
import { authCookieName, verifyAuthToken } from '@/lib/auth'
import { logAdminAction } from '@/lib/audit'
import { sendRegistrationNotificationEmail, sendEventRegistrationEmail } from '@/lib/email'
import { createNotification, createNotificationForAdmin } from '@/lib/notifications'
import { archiveRegistrationsByIds } from '@/lib/registration-archive'
import * as z from 'zod'

export const runtime = 'nodejs'

const bulkSchema = z.object({
  ids: z.array(z.union([z.string(), z.number()])).min(1).max(50),
  action: z.enum(['approve', 'reject', 'delete', 'attend', 'noshow']),
  reason: z.string().trim().max(500).optional(),
})

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get(authCookieName)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await verifyAuthToken(token)
  if (payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = bulkSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  const { ids, action, reason: rawReason } = parsed.data
  const reason = rawReason || ''

  // Deduplicate to reduce work
  const uniqueIds = Array.from(new Set(ids.map(String)))

  // Eligibility rules (frontend mirrors these)
  const eligibleStatuses: Record<string, string[]> = {
    approve: ['pending', 'waitlisted'],
    reject: ['pending', 'waitlisted'],
    attend: ['confirmed'],
    noshow: ['confirmed'],
    delete: ['pending', 'waitlisted', 'confirmed', 'attended', 'cancelled', 'no-show', 'rejected'],
  }

  const conn = await getDb().getConnection()
  
  let committed = false
  const notificationTasks: Promise<unknown>[] = []

  try {
    await conn.beginTransaction()

    // Preload all registrations once
    const placeholders = uniqueIds.map(() => '?').join(',')
    const [rows] = await conn.execute(
      `SELECT r.id, r.status, r.user_id, u.name AS user_name, u.email AS user_email,
              r.event_id, e.title AS event_title, e.date AS event_date, e.time AS event_time,
              e.location AS event_location, e.available_slots
       FROM registrations r
       LEFT JOIN users u ON u.id = r.user_id
       LEFT JOIN events e ON e.id = r.event_id
       WHERE r.id IN (${placeholders})
       FOR UPDATE`,
      uniqueIds
    )
    const infoList = rows as any[]

    const eligible = infoList.filter((row) => eligibleStatuses[action].includes(row.status))
    const eligibleIdsList = eligible.map((r) => String(r.id))
    const skippedIds = uniqueIds.filter((id) => !eligibleIdsList.includes(id))

    if (eligibleIdsList.length === 0) {
      await conn.rollback()
      return NextResponse.json({ ok: true, processed: 0, skipped: skippedIds.length })
    }

    if (action === 'delete') {
      // Archive registrations first, then delete from active table.
      await archiveRegistrationsByIds(conn, eligibleIdsList, payload.sub, 'registration.bulk_delete')

      const delPlaceholders = eligibleIdsList.map(() => '?').join(',')
      await conn.execute(`DELETE FROM registrations WHERE id IN (${delPlaceholders})`, eligibleIdsList)
      
      logAdminAction({
        adminUserId: payload.sub,
        action: 'registration.bulk_delete',
        entityType: 'registration',
        entityId: 'bulk',
        details: { count: eligibleIdsList.length, registrationIds: eligibleIdsList },
      })
    } else {
      // Approve, reject, attend, or mark no-show
      const newStatus =
        action === 'approve'
          ? 'confirmed'
          : action === 'attend'
            ? 'attended'
            : action === 'reject'
              ? 'rejected'
              : 'no-show'
      const displayStatus = newStatus
      const effectiveReason = reason || (action === 'noshow' ? 'Marked as no show' : '')

      // Capacity checks for approvals: ensure we don't oversubscribe
      if (action === 'approve') {
        const approvalsByEvent: Record<string, number> = {}
        eligible.forEach((row) => {
          approvalsByEvent[row.event_id] = (approvalsByEvent[row.event_id] || 0) + 1
        })
        for (const row of eligible) {
          const needed = approvalsByEvent[row.event_id] || 0
          if (row.available_slots < needed) {
            throw new Error(`Not enough available slots for event "${row.event_title}". Needed ${needed}, available ${row.available_slots}.`)
          }
        }
        // Apply slot decrements per event
        for (const [eventId, count] of Object.entries(approvalsByEvent)) {
          await conn.execute('UPDATE events SET available_slots = available_slots - ? WHERE id = ?', [count, eventId])
        }
      }

      // Slot releases when leaving confirmed (reject/noshow/delete on confirmed, but not attended)
      if (action === 'reject' || action === 'noshow') {
        const releasesByEvent: Record<string, number> = {}
        eligible.forEach((row) => {
          if (row.status === 'confirmed') {
            releasesByEvent[row.event_id] = (releasesByEvent[row.event_id] || 0) + 1
          }
        })
        for (const [eventId, count] of Object.entries(releasesByEvent)) {
          await conn.execute('UPDATE events SET available_slots = available_slots + ? WHERE id = ?', [count, eventId])
        }
      }
      
      for (const info of eligible) {
        // Update status
        await conn.execute('UPDATE registrations SET status = ? WHERE id = ?', [newStatus, info.id])
        
        // Queue emails/notifications after commit
        const eventDate = info.event_date || 'TBD'
        const userId = String(info.user_id)
        const eventTitle = String(info.event_title)
        const userName = String(info.user_name)
        const reasonSuffix = effectiveReason ? ` Reason: ${effectiveReason}` : ''

        notificationTasks.push(
          Promise.allSettled([
            sendRegistrationNotificationEmail(
              String(eventTitle),
              String(userName),
              String(info.user_email),
              eventDate,
              displayStatus
            ),
            sendEventRegistrationEmail(
              String(info.user_email),
              String(userName),
              String(eventTitle),
              eventDate,
              info.event_time || 'TBD',
              info.event_location || 'TBD',
              displayStatus,
              {
                registrationId: String(info.id),
                eventId: String(info.event_id),
              }
            ),
            displayStatus === 'confirmed'
              ? createNotification({
                  userId,
                  title: 'Registration Approved',
                  message: `Your registration for "${eventTitle}" has been approved!`,
                  type: 'registration_approved'
                })
              : displayStatus === 'attended'
                ? createNotification({
                    userId,
                    title: 'Attendance Marked',
                    message: `Your attendance for "${eventTitle}" has been recorded. Thank you!`,
                    type: 'registration_attended'
                  })
                : createNotification({
                    userId,
                    title: 'Registration Rejected',
                    message: `Your registration for "${eventTitle}" has been ${displayStatus === 'no-show' ? 'marked as no show' : displayStatus}.${reasonSuffix}`,
                    type: 'registration_rejected'
                  }),
            displayStatus === 'confirmed'
              ? createNotificationForAdmin({
                  title: 'Registration Approved',
                  message: `${userName}'s registration for "${eventTitle}" has been approved.`,
                  type: 'registration_approved'
                })
              : displayStatus === 'attended'
                ? createNotificationForAdmin({
                    title: 'Attendance Marked',
                    message: `${userName} marked as attended for "${eventTitle}".`,
                    type: 'registration_attended'
                  })
                : createNotificationForAdmin({
                    title: 'Registration Rejected',
                    message: `${userName}'s registration for "${eventTitle}" has been ${displayStatus === 'no-show' ? 'marked as no show' : displayStatus}.${reasonSuffix}`,
                    type: 'registration_rejected'
                  }),
          ])
        )
      }
      
      logAdminAction({
        adminUserId: payload.sub,
        action:
          action === 'approve'
            ? 'registration.bulk_approve'
            : action === 'attend'
              ? 'registration.bulk_attend'
              : action === 'noshow'
                ? 'registration.bulk_no_show'
                : 'registration.bulk_reject',
        entityType: 'registration',
        entityId: 'bulk',
        details: { count: eligibleIdsList.length, action: newStatus, reason: reason || undefined, skipped: skippedIds },
      })
    }

    await conn.commit()
    committed = true
    // Send notifications concurrently outside the transaction
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    if (notificationTasks.length > 0) {
      Promise.allSettled(notificationTasks)
    }

    return NextResponse.json({ ok: true, processed: eligibleIdsList.length, skipped: skippedIds.length })
  } catch (err: any) {
    if (!committed) {
      try {
        await conn.rollback()
      } catch (rollbackError) {
        console.error('Bulk registrations rollback failed:', rollbackError)
      }
    }
    return NextResponse.json({ error: err.message || 'Bulk action failed' }, { status: 500 })
  } finally {
    conn.release()
  }
}
