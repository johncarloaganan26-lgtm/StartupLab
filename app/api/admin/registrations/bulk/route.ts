import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'
import { authCookieName, verifyAuthToken } from '@/lib/auth'
import { logAdminAction } from '@/lib/audit'
import { sendRegistrationNotificationEmail, sendEventRegistrationEmail } from '@/lib/email'
import { createNotification, createNotificationForAdmin } from '@/lib/notifications'
import { archiveRegistrationsByIds } from '@/lib/registration-archive'

export const runtime = 'nodejs'

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

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
  }

  const allowedActions = ['approve', 'reject', 'delete', 'attend']
  if (!action || !allowedActions.includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const conn = await getDb().getConnection()
  
  try {
    await conn.beginTransaction()

    if (action === 'delete') {
      // Archive registrations first, then delete from active table.
      await archiveRegistrationsByIds(conn, ids, payload.sub, 'registration.bulk_delete')

      const placeholders = ids.map(() => '?').join(',')
      await conn.execute(`DELETE FROM registrations WHERE id IN (${placeholders})`, ids)
      
      logAdminAction({
        adminUserId: payload.sub,
        action: 'registration.bulk_delete',
        entityType: 'registration',
        entityId: 'bulk',
        details: { count: ids.length, registrationIds: ids },
      })
    } else {
      // Approve, reject, or attend
      const newStatus = action === 'approve' ? 'confirmed' : action === 'attend' ? 'attended' : 'cancelled'
      
      for (const id of ids) {
        // Get current status and event info
        const [infoRows] = await conn.execute(
          `SELECT r.status, r.user_id, u.name AS user_name, u.email AS user_email, r.event_id, e.title AS event_title, e.date AS event_date, e.time AS event_time, e.location AS event_location, e.available_slots
           FROM registrations r
           LEFT JOIN users u ON u.id = r.user_id
           LEFT JOIN events e ON e.id = r.event_id
           WHERE r.id = ?`,
          [id]
        )
        
        const info = (infoRows as any[]).length > 0 ? (infoRows as any[])[0] : null
        if (!info) continue
        
        const prevStatus = info.status
        
        // Handle slot logic for approve
        if (newStatus === 'confirmed' && prevStatus !== 'confirmed' && info.available_slots > 0) {
          await conn.execute('UPDATE events SET available_slots = available_slots - 1 WHERE id = ?', [info.event_id])
        }
        
        // Update status
        await conn.execute('UPDATE registrations SET status = ? WHERE id = ?', [newStatus, id])
        
        // Send notification email to support
        const eventDate = info.event_date || 'TBD'
        await sendRegistrationNotificationEmail(
          String(info.event_title),
          String(info.user_name),
          String(info.user_email),
          eventDate,
          newStatus
        )
        
        // Also send email to user about their status change
        await sendEventRegistrationEmail(
          String(info.user_email),
          String(info.user_name),
          String(info.event_title),
          eventDate,
          info.event_time || 'TBD',
          info.event_location || 'TBD',
          newStatus,
          {
            registrationId: String(id),
            eventId: String(info.event_id),
          }
        )
        
        // Create in-app notifications
        const userId = String(info.user_id)
        const eventTitle = String(info.event_title)
        const userName = String(info.user_name)
        
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
        } else if (newStatus === 'cancelled') {
          await createNotification({
            userId,
            title: 'Registration Rejected',
            message: `Your registration for "${eventTitle}" has been cancelled.`,
            type: 'registration_rejected'
          })
          await createNotificationForAdmin({
            title: 'Registration Rejected',
            message: `${userName}'s registration for "${eventTitle}" has been cancelled.`,
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
              : 'registration.bulk_reject',
        entityType: 'registration',
        entityId: 'bulk',
        details: { count: ids.length, action: newStatus },
      })
    }

    await conn.commit()
    return NextResponse.json({ ok: true, processed: ids.length })
  } catch (err: any) {
    await conn.rollback()
    return NextResponse.json({ error: err.message || 'Bulk action failed' }, { status: 500 })
  } finally {
    conn.release()
  }
}
