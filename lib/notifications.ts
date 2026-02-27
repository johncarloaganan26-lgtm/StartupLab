import { getDb } from '@/lib/db'

export type NotificationType = 'registration_pending' | 'registration_approved' | 'registration_rejected' | 'registration_attended' | 'general'

export interface Notification {
  id?: number
  user_id: string
  title: string
  message: string
  type: NotificationType
  is_read?: boolean
  created_at?: Date
}

export async function createNotification({
  userId,
  title,
  message,
  type,
}: {
  userId: string
  title: string
  message: string
  type: NotificationType
}) {
  try {
    await getDb().execute(
      'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, 0)',
      [userId, title, message, type]
    )
    return true
  } catch (error) {
    console.error('Error creating notification:', error)
    return false
  }
}

export async function createNotificationForAdmin({
  title,
  message,
  type,
}: {
  title: string
  message: string
  type: NotificationType
}) {
  try {
    // Get admin user IDs
    const [rows] = await getDb().execute(
      "SELECT id FROM users WHERE role = 'admin'"
    )
    const admins = rows as any[]
    
    for (const admin of admins) {
      await getDb().execute(
        'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, 0)',
        [admin.id, title, message, type]
      )
    }
    return true
  } catch (error) {
    console.error('Error creating admin notification:', error)
    return false
  }
}
