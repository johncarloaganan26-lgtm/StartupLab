const mysql = require('mysql2/promise');

const config = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '',
  database: 'startup_lab',
  connectionLimit: 10,
};

async function checkDbData() {
  const pool = mysql.createPool(config);
  
  try {
    console.log('=== Database Connection Successful ===');
    
    // Check users
    const [users] = await pool.execute('SELECT * FROM users');
    console.log(`=== Users (${users.length}) ===`);
    console.log(users);
    
    // Check events
    const [events] = await pool.execute('SELECT * FROM events WHERE deleted_at IS NULL');
    console.log(`=== Events (${events.length}) ===`);
    console.log(events);
    
    // Check registrations
    const [registrations] = await pool.execute('SELECT * FROM registrations');
    console.log(`=== Registrations (${registrations.length}) ===`);
    console.log(registrations);
    
    // Check audit logs
    const [auditLogs] = await pool.execute('SELECT * FROM audit_logs');
    console.log(`=== Audit Logs (${auditLogs.length}) ===`);
    console.log(auditLogs);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkDbData();
