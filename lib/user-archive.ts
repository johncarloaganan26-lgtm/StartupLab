import type { PoolConnection } from 'mysql2/promise'

type ArchivedUserSourceRow = {
  id: string | number
  name: string
  email: string
  password_hash: string | null
  role: string
  company: string | null
  phone: string | null
  bio: string | null
  created_at: string | Date | null
}

function buildPlaceholders(count: number) {
  return Array.from({ length: count }, () => '?').join(',')
}

export async function ensureArchivedUsersTable(conn: PoolConnection) {
  await conn.execute(
    `CREATE TABLE IF NOT EXISTS archived_users (
      id BIGINT NOT NULL AUTO_INCREMENT,
      user_id BIGINT NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NULL,
      role VARCHAR(32) NOT NULL,
      company VARCHAR(255) NULL,
      phone VARCHAR(64) NULL,
      bio TEXT NULL,
      created_at_original DATETIME NULL,
      deleted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_by BIGINT NULL,
      deletion_source VARCHAR(64) NULL,
      PRIMARY KEY (id),
      INDEX idx_archived_users_deleted_at (deleted_at),
      INDEX idx_archived_users_user_id (user_id),
      INDEX idx_archived_users_email (email)
    )`
  )

  try {
    await conn.execute('ALTER TABLE archived_users ADD COLUMN password_hash VARCHAR(255) NULL AFTER email')
  } catch (error: any) {
    if (error?.code !== 'ER_DUP_FIELDNAME') {
      throw error
    }
  }
}

export async function archiveUsersByIds(
  conn: PoolConnection,
  userIds: Array<string | number>,
  deletedBy: string | number | null,
  deletionSource: string
) {
  if (!userIds.length) return 0

  await ensureArchivedUsersTable(conn)

  const placeholders = buildPlaceholders(userIds.length)
  const [rows] = await conn.execute(
    `SELECT id, name, email, password_hash, role, company, phone, bio, created_at
     FROM users
     WHERE id IN (${placeholders})`,
    userIds
  )
  const users = rows as ArchivedUserSourceRow[]
  if (!users.length) return 0

  const rowPlaceholders = users.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)').join(',')
  const values: Array<string | number | Date | null> = []
  for (const user of users) {
    values.push(
      user.id,
      user.name,
      user.email,
      user.password_hash ?? null,
      user.role,
      user.company ?? null,
      user.phone ?? null,
      user.bio ?? null,
      user.created_at ?? null,
      deletedBy === undefined ? null : deletedBy,
      deletionSource
    )
  }

  await conn.execute(
    `INSERT INTO archived_users (
      user_id,
      name,
      email,
      password_hash,
      role,
      company,
      phone,
      bio,
      created_at_original,
      deleted_by,
      deletion_source,
      deleted_at
    ) VALUES ${rowPlaceholders}`,
    values
  )

  return users.length
}
