import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { RowDataPacket } from 'mysql2/promise'
import { getDb } from '@/lib/db'
import { authCookieName, verifyAuthToken } from '@/lib/auth'
import { logUserAction } from '@/lib/audit'

export const runtime = 'nodejs'

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(authCookieName)?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyAuthToken(token)
    const userId = payload.sub

    const body = await req.json()
    const name = String(body?.name ?? '').trim()
    const email = String(body?.email ?? '').trim().toLowerCase()
    const company = body?.company ? String(body.company).trim() : null
    const phone = body?.phone ? String(body.phone).trim() : null
    const bio = body?.bio ? String(body.bio).trim() : null

    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters.' }, { status: 400 })
    }
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    // Check if email is taken by another user
    const [existing] = await getDb().execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1',
      [email, userId]
    )
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email is already in use by another account.' }, { status: 409 })
    }

    await getDb().execute(
      `UPDATE users SET name = ?, email = ?, company = ?, phone = ?, bio = ? WHERE id = ?`,
      [name, email, company, phone, bio, userId]
    )

    logUserAction({
      userId,
      action: 'profile.update',
      entityType: 'user',
      entityId: userId,
      details: { name, email, company, phone, bio },
    })

    // Return updated user
    const [rows] = await getDb().execute<RowDataPacket[]>(
      'SELECT id, name, email, role, company, phone, bio, created_at FROM users WHERE id = ? LIMIT 1',
      [userId]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    const userRow = rows[0]
    const user = {
      id: String(userRow.id),
      name: String(userRow.name),
      email: String(userRow.email),
      role: userRow.role,
      company: userRow.company ? String(userRow.company) : '',
      phone: userRow.phone ? String(userRow.phone) : '',
      bio: userRow.bio ? String(userRow.bio) : '',
      createdAt: userRow.created_at ? String(userRow.created_at) : null,
    }

    return NextResponse.json({ user })
  } catch (err) {
    console.error('Profile update failed', err)
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 })
  }
}
