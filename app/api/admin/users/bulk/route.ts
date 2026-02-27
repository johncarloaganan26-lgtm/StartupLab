import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';
import { logAdminAction } from '@/lib/audit';
import { archiveUsersByIds } from '@/lib/user-archive';
import { archiveRegistrationsByUserIds } from '@/lib/registration-archive';

export const runtime = 'nodejs';

export async function DELETE(req: Request) {
    try {
        const admin = await requireAdminAuth();
        const { ids } = await req.json();

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        const placeholders = ids.map(() => '?').join(',');
        const conn = await getDb().getConnection();
        try {
            await conn.beginTransaction();
            await archiveRegistrationsByUserIds(conn, ids, admin.sub, 'user.bulk_delete');
            await conn.execute(`DELETE FROM registrations WHERE user_id IN (${placeholders})`, ids);
            await archiveUsersByIds(conn, ids, admin.sub, 'user.bulk_delete');
            await conn.execute(`DELETE FROM users WHERE id IN (${placeholders})`, ids);
            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }

        logAdminAction({
            adminUserId: admin.sub,
            action: 'user.bulk_delete',
            entityType: 'user',
            entityId: 'bulk',
            details: { count: ids.length, userIds: ids },
        });

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        if (err instanceof NextResponse) return err;
        console.error('Bulk user delete failed:', err);
        return NextResponse.json({ error: 'Failed to delete users' }, { status: 500 });
    }
}
