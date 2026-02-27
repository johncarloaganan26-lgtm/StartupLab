import { getDb } from './lib/db.ts';

async function checkData() {
    try {
        const [regs] = await getDb().execute('SELECT COUNT(*) as count FROM registrations');
        const [logs] = await getDb().execute('SELECT COUNT(*) as count FROM audit_logs');
        const [users] = await getDb().execute('SELECT id, name, role FROM users');

        console.log('--- Database Status ---');
        console.log('Total Users:', (users as any).length);
        console.log('User Details:', users);
        console.log('Registrations:', (regs as any)[0].count);
        console.log('Audit Logs:', (logs as any)[0].count);

        if ((logs as any)[0].count > 0) {
            const [lastLogs] = await getDb().execute('SELECT id, admin_user_id, action FROM audit_logs ORDER BY created_at DESC LIMIT 5');
            console.log('\nLast 5 Audit Logs (Summary):', lastLogs);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error checking data:', err);
        process.exit(1);
    }
}

checkData();
