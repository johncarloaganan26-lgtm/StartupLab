import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit'

export const runtime = 'nodejs'

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const admin = await requireAdminAuth()
        const { id } = await params
        const { role } = await req.json()

        if (!['admin', 'attendee'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
        }

        // Prevent de-admining yourself if you are the only admin (optional but good)
        // For now, just proceed with the update.

        await getDb().execute('UPDATE users SET role = ? WHERE id = ?', [role, id])

        logAdminAction({
            adminUserId: admin.sub,
            action: 'user.update_role',
            entityType: 'user',
            entityId: id,
            details: { newRole: role },
        })

        return NextResponse.json({ message: 'User role updated successfully.' })
    } catch (err) {
        console.error('Update user role failed', err)
        return NextResponse.json({ error: 'Failed to update user role.' }, { status: 500 })
    }
}
