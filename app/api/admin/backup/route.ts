import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'
import { authCookieName, verifyAuthToken } from '@/lib/auth'

export const runtime = 'nodejs'

type RowRecord = Record<string, any>

function escapeSqlValue(value: any): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL'
  if (typeof value === 'boolean') return value ? '1' : '0'
  if (value instanceof Date) {
    const iso = value.toISOString().slice(0, 19).replace('T', ' ')
    return `'${iso}'`
  }
  if (Buffer.isBuffer(value)) return `X'${value.toString('hex')}'`
  if (typeof value === 'object') return `'${JSON.stringify(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`
}

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let inSingle = false
  let inDouble = false
  let inBacktick = false
  let prev = ''

  for (const ch of sql) {
    if (ch === "'" && !inDouble && !inBacktick && prev !== '\\') inSingle = !inSingle
    else if (ch === '"' && !inSingle && !inBacktick && prev !== '\\') inDouble = !inDouble
    else if (ch === '`' && !inSingle && !inDouble && prev !== '\\') inBacktick = !inBacktick

    if (ch === ';' && !inSingle && !inDouble && !inBacktick) {
      const stmt = current.trim()
      if (stmt) statements.push(stmt)
      current = ''
    } else {
      current += ch
    }
    prev = ch
  }

  const tail = current.trim()
  if (tail) statements.push(tail)
  return statements
}

async function requireAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get(authCookieName)?.value
  if (!token) return null
  const payload = await verifyAuthToken(token)
  return payload.role === 'admin' ? payload : null
}

export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const db = getDb()
    const [tablesRows] = await db.query('SHOW TABLES')
    const tableKeys = Object.keys((tablesRows as RowRecord[])[0] || {})
    const tableNameKey = tableKeys[0]
    const tableNames = (tablesRows as RowRecord[]).map((row) => String(row[tableNameKey]))

    const lines: string[] = []
    lines.push('-- Startup Lab SQL Backup')
    lines.push(`-- Generated at: ${new Date().toISOString()}`)
    lines.push('SET FOREIGN_KEY_CHECKS=0;')
    lines.push('')

    for (const table of tableNames) {
      const [createRows] = await db.query(`SHOW CREATE TABLE \`${table}\``)
      const createRow = (createRows as RowRecord[])[0]
      const createSql = String(createRow['Create Table'] || createRow['Create View'] || '')
      if (!createSql) continue

      lines.push(`-- Table: ${table}`)
      lines.push(`DROP TABLE IF EXISTS \`${table}\`;`)
      lines.push(`${createSql};`)

      const [rows] = await db.query(`SELECT * FROM \`${table}\``)
      const dataRows = rows as RowRecord[]
      if (dataRows.length > 0) {
        const columns = Object.keys(dataRows[0]).map((c) => `\`${c}\``).join(', ')
        const valueChunks = dataRows.map((row) => {
          const vals = Object.values(row).map((v) => escapeSqlValue(v)).join(', ')
          return `(${vals})`
        })
        lines.push(`INSERT INTO \`${table}\` (${columns}) VALUES`)
        lines.push(`${valueChunks.join(',\n')};`)
      }
      lines.push('')
    }

    lines.push('SET FOREIGN_KEY_CHECKS=1;')
    lines.push('')

    const sql = lines.join('\n')
    return new NextResponse(sql, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql; charset=utf-8',
        'Content-Disposition': `attachment; filename="startup_lab_backup_${Date.now()}.sql"`,
      },
    })
  } catch (error) {
    console.error('Backup export failed:', error)
    return NextResponse.json({ error: 'Failed to export backup' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const formData = await req.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'SQL file is required' }, { status: 400 })
    }

    const sqlText = await file.text()
    if (!sqlText.trim()) {
      return NextResponse.json({ error: 'SQL file is empty' }, { status: 400 })
    }

    const statements = splitSqlStatements(sqlText).filter((s) => s.trim())
    if (statements.length === 0) {
      return NextResponse.json({ error: 'No executable SQL statements found' }, { status: 400 })
    }

    const db = getDb()
    const conn = await db.getConnection()
    try {
      await conn.beginTransaction()
      for (const stmt of statements) {
        await conn.query(stmt)
      }
      await conn.commit()
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }

    return NextResponse.json({ ok: true, statements: statements.length })
  } catch (error) {
    console.error('Backup import failed:', error)
    return NextResponse.json({ error: 'Failed to import backup SQL' }, { status: 500 })
  }
}

