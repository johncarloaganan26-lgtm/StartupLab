import type { PoolConnection } from 'mysql2/promise'

type ArchivedRegistrationSourceRow = {
  id: string | number
  event_id: string | number
  user_id: string | number
  status: string
  registered_at: string | Date | null
  user_name: string | null
  user_email: string | null
  event_title: string | null
  event_date: string | Date | null
  event_time: string | null
  event_location: string | null
}

function buildPlaceholders(count: number) {
  return Array.from({ length: count }, () => '?').join(',')
}

export async function ensureArchivedRegistrationsTable(conn: PoolConnection) {
  await conn.execute(
    `CREATE TABLE IF NOT EXISTS archived_registrations (
      id BIGINT NOT NULL AUTO_INCREMENT,
      registration_id BIGINT NULL,
      event_id BIGINT NOT NULL,
      user_id BIGINT NOT NULL,
      status VARCHAR(32) NOT NULL,
      registered_at DATETIME NULL,
      user_name VARCHAR(255) NULL,
      user_email VARCHAR(255) NULL,
      event_title VARCHAR(255) NULL,
      event_date DATE NULL,
      event_time VARCHAR(32) NULL,
      event_location VARCHAR(255) NULL,
      deleted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_by BIGINT NULL,
      deletion_source VARCHAR(64) NULL,
      PRIMARY KEY (id),
      INDEX idx_archived_registrations_deleted_at (deleted_at),
      INDEX idx_archived_registrations_event_id (event_id),
      INDEX idx_archived_registrations_user_id (user_id),
      INDEX idx_archived_registrations_registration_id (registration_id)
    )`
  )
}

async function fetchRegistrationsForArchive(
  conn: PoolConnection,
  whereClause: string,
  values: Array<string | number>
) {
  const [rows] = await conn.execute(
    `SELECT
       r.id,
       r.event_id,
       r.user_id,
       r.status,
       r.registered_at,
       u.name AS user_name,
       u.email AS user_email,
       e.title AS event_title,
       e.date AS event_date,
       e.time AS event_time,
       e.location AS event_location
     FROM registrations r
     LEFT JOIN users u ON u.id = r.user_id
     LEFT JOIN events e ON e.id = r.event_id
     WHERE ${whereClause}`,
    values
  )
  return rows as ArchivedRegistrationSourceRow[]
}

async function insertArchivedRows(
  conn: PoolConnection,
  rows: ArchivedRegistrationSourceRow[],
  deletedBy: string | number | null,
  deletionSource: string
) {
  if (rows.length === 0) return 0
  await ensureArchivedRegistrationsTable(conn)

  const rowPlaceholders = rows.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)').join(',')
  const values: Array<string | number | Date | null> = []

  for (const row of rows) {
    values.push(
      row.id,
      row.event_id,
      row.user_id,
      row.status,
      row.registered_at ?? null,
      row.user_name ?? null,
      row.user_email ?? null,
      row.event_title ?? null,
      row.event_date ?? null,
      row.event_time ?? null,
      row.event_location ?? null,
      deletedBy === undefined ? null : deletedBy,
      deletionSource
    )
  }

  await conn.execute(
    `INSERT INTO archived_registrations (
       registration_id,
       event_id,
       user_id,
       status,
       registered_at,
       user_name,
       user_email,
       event_title,
       event_date,
       event_time,
       event_location,
       deleted_by,
       deletion_source,
       deleted_at
     ) VALUES ${rowPlaceholders}`,
    values
  )

  return rows.length
}

export async function archiveRegistrationsByIds(
  conn: PoolConnection,
  registrationIds: Array<string | number>,
  deletedBy: string | number | null,
  deletionSource: string
) {
  if (!registrationIds.length) return 0
  const placeholders = buildPlaceholders(registrationIds.length)
  const rows = await fetchRegistrationsForArchive(conn, `r.id IN (${placeholders})`, registrationIds)
  return insertArchivedRows(conn, rows, deletedBy, deletionSource)
}

export async function archiveRegistrationsByEventIds(
  conn: PoolConnection,
  eventIds: Array<string | number>,
  deletedBy: string | number | null,
  deletionSource: string
) {
  if (!eventIds.length) return 0
  const placeholders = buildPlaceholders(eventIds.length)
  const rows = await fetchRegistrationsForArchive(conn, `r.event_id IN (${placeholders})`, eventIds)
  return insertArchivedRows(conn, rows, deletedBy, deletionSource)
}

export async function archiveRegistrationsByUserIds(
  conn: PoolConnection,
  userIds: Array<string | number>,
  deletedBy: string | number | null,
  deletionSource: string
) {
  if (!userIds.length) return 0
  const placeholders = buildPlaceholders(userIds.length)
  const rows = await fetchRegistrationsForArchive(conn, `r.user_id IN (${placeholders})`, userIds)
  return insertArchivedRows(conn, rows, deletedBy, deletionSource)
}
