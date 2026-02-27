import { getDb } from './lib/db.ts';

async function checkData() {
    try {
        const [users] = await getDb().execute('SELECT id, name, role FROM users');
        const [regs] = await getDb().execute('SELECT id, user_id, event_id FROM registrations');
        const [events] = await getDb().execute('SELECT id, title FROM events');

        console.log('--- Database Integrity ---');
        console.log('Users:', users);
        console.log('Events:', events);
        console.log('Registrations:', regs);

        process.exit(0);
    } catch (err) {
        console.error('Error checking data:', err);
        process.exit(1);
    }
}

checkData();
