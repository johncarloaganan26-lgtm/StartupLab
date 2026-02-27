import { getDb } from './lib/db';

async function deepCheck() {
    try {
        const [users] = await getDb().execute('SELECT id, name, role FROM users');
        console.log('--- USERS ---');
        console.log(users);

        const [events] = await getDb().execute('SELECT id, title FROM events');
        console.log('--- EVENTS ---');
        console.log(events);

        const [regs] = await getDb().execute('SELECT id, user_id, event_id, status FROM registrations');
        console.log('--- REGISTRATIONS ---');
        console.log(regs);

        const [logs] = await getDb().execute('SELECT id, admin_user_id, action, entity_type FROM audit_logs ORDER BY created_at DESC LIMIT 10');
        console.log('--- AUDIT LOGS ---');
        console.log(logs);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

deepCheck();
