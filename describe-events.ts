import { getDb } from './lib/db';

async function describeTable() {
    try {
        const [rows] = await getDb().execute('DESCRIBE events');
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

describeTable();
