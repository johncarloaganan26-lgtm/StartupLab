import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import type { RowDataPacket } from 'mysql2/promise'
import { getDb } from '@/lib/db'
import { authCookieName, verifyAuthToken } from '@/lib/auth'

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
        const currentPassword = String(body?.currentPassword ?? '')
        const newPassword = String(body?.newPassword ?? '')

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Current and new passwords are required.' }, { status: 400 })
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 })
        }

        const [rows] = await getDb().execute<RowDataPacket[]>(
            'SELECT id, password_hash FROM users WHERE id = ? LIMIT 1',
            [userId]
        )

        if (rows.length === 0) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 })
        }

        const isValid = await bcrypt.compare(currentPassword, String(rows[0].password_hash))
        if (!isValid) {
            return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 403 })
        }

        const newHash = await bcrypt.hash(newPassword, 10)
        await getDb().execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId])

        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error('Password change failed', err)
        return NextResponse.json({ error: 'Failed to change password.' }, { status: 500 })
    }
}
