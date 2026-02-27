import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'
import { authCookieName, verifyAuthToken } from '@/lib/auth'
import { logAdminAction } from '@/lib/audit'
import { sendRegistrationNotificationEmail, sendEventRegistrationEmail } from '@/lib/email'
import { createNotification, createNotificationForAdmin } from '@/lib/notifications'
import { archiveRegistrationsByIds } from '@/lib/registration-archive'

export const runtime = 'nodejs'

async function ensureStatusEnum(conn: any) {
  try {
    await conn.execute(
      "ALTER TABLE registrations MODIFY COLUMN status ENUM('pending','confirmed','attended','cancelled','waitlisted','no-show','rejected') NOT NULL DEFAULT 'pending'"
    )
  } catch (err: any) {
    // Ignore if insufficient privileges or already compatible
  }
}

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get(authCookieName)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await verifyAuthToken(token)
  if (payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { ids, action } = body
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : ''

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
  }

  const allowedActions = ['approve', 'reject', 'delete', 'attend', 'noshow']
  if (!action || !allowedActions.includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

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
  
  try {
    await conn.beginTransaction()
    await ensureStatusEnum(conn)

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
      if (action === 'reject' || action === 'noshow' || action === 'delete') {
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
        
        // Send notification email to support
        const eventDate = info.event_date || 'TBD'
        await sendRegistrationNotificationEmail(
          String(info.event_title),
          String(info.user_name),
          String(info.user_email),
          eventDate,
          displayStatus
        )
        
        // Also send email to user about their status change
        await sendEventRegistrationEmail(
          String(info.user_email),
          String(info.user_name),
          String(info.event_title),
          eventDate,
          info.event_time || 'TBD',
          info.event_location || 'TBD',
          displayStatus,
          {
            registrationId: String(info.id),
            eventId: String(info.event_id),
          }
        )
        
        // Create in-app notifications
        const userId = String(info.user_id)
        const eventTitle = String(info.event_title)
        const userName = String(info.user_name)
        
        const reasonSuffix = effectiveReason ? ` Reason: ${effectiveReason}` : ''

        if (newStatus === 'confirmed') {
          await createNotification({
            userId,
            title: 'Registration Approved',
            message: `Your registration for "${eventTitle}" has been approved!`,
            type: 'registration_approved'
          })
          await createNotificationForAdmin({
            title: 'Registration Approved',
            message: `${userName}'s registration for "${eventTitle}" has been approved.`,
            type: 'registration_approved'
          })
        } else if (displayStatus === 'rejected' || displayStatus === 'no-show' || displayStatus === 'cancelled') {
          await createNotification({
            userId,
            title: 'Registration Rejected',
            message: `Your registration for "${eventTitle}" has been ${displayStatus === 'no-show' ? 'marked as no show' : displayStatus}.${reasonSuffix}`,
            type: 'registration_rejected'
          })
          await createNotificationForAdmin({
            title: 'Registration Rejected',
            message: `${userName}'s registration for "${eventTitle}" has been ${displayStatus === 'no-show' ? 'marked as no show' : displayStatus}.${reasonSuffix}`,
            type: 'registration_rejected'
          })
        } else if (newStatus === 'attended') {
          await createNotification({
            userId,
            title: 'Attendance Marked',
            message: `Your attendance for "${eventTitle}" has been recorded. Thank you!`,
            type: 'registration_attended'
          })
          await createNotificationForAdmin({
            title: 'Attendance Marked',
            message: `${userName} marked as attended for "${eventTitle}".`,
            type: 'registration_attended'
          })
        }
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
    return NextResponse.json({ ok: true, processed: eligibleIdsList.length, skipped: skippedIds.length })
  } catch (err: any) {
    await conn.rollback()
    return NextResponse.json({ error: err.message || 'Bulk action failed' }, { status: 500 })
  } finally {
    conn.release()
  }
}
