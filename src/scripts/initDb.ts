import fs from 'fs';
import path from 'path';
import { pool } from '../config/db';

const run = async () => {
  for (const file of ['schema.sql', 'seed.sql']) {
    const sql = fs.readFileSync(path.join(__dirname, '../../db', file), 'utf8');
    await pool.query(sql);
    console.log(`Applied ${file}`);
  }
  await pool.end();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
