import mysql from 'mysql2/promise'

const globalForDb = globalThis as unknown as { mysqlPool?: mysql.Pool }

function getConfig() {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env
  if (!DB_HOST || !DB_USER || !DB_NAME) {
    throw new Error('Database env vars missing: DB_HOST, DB_USER, DB_NAME are required.')
  }

  return {
    host: DB_HOST,
    port: DB_PORT ? Number(DB_PORT) : 3306,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    connectionLimit: 10,
  }
}

export function getDb() {
  if (!globalForDb.mysqlPool) {
    globalForDb.mysqlPool = mysql.createPool(getConfig())
  }
  return globalForDb.mysqlPool
}
