import { getDb } from './lib/db';

async function fixIntegrity() {
    try {
        const [users] = await getDb().execute('SELECT id, name FROM users');
        const userList = users as any[];
        console.log('Current Users:', userList);

        const [orphanedRegs] = await getDb().execute(`
      SELECT r.id, r.user_id 
      FROM registrations r 
      LEFT JOIN users u ON r.user_id = u.id 
      WHERE u.id IS NULL
    `);
        console.log('Orphaned Registrations (User missing):', orphanedRegs);

        const [orphanedLogs] = await getDb().execute(`
      SELECT al.id, al.admin_user_id 
      FROM audit_logs al 
      LEFT JOIN users u ON al.admin_user_id = u.id 
      WHERE u.id IS NULL
    `);
        console.log('Orphaned Audit Logs (Admin missing):', orphanedLogs);

        if (userList.length > 0) {
            const firstUserId = userList[0].id;
            console.log(`\nRe-assigning orphaned records to User ID: ${firstUserId} (${userList[0].name})`);

            const [updateRegs] = await getDb().execute(`
        UPDATE registrations 
        SET user_id = ? 
        WHERE user_id NOT IN (SELECT id FROM users)
      `, [firstUserId]);

            const [updateLogs] = await getDb().execute(`
        UPDATE audit_logs 
        SET admin_user_id = ? 
        WHERE admin_user_id NOT IN (SELECT id FROM users)
      `, [firstUserId]);

            console.log('Update Result (Registrations):', (updateRegs as any).affectedRows);
            console.log('Update Result (Audit Logs):', (updateLogs as any).affectedRows);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error fixing integrity:', err);
        process.exit(1);
    }
}

fixIntegrity();
