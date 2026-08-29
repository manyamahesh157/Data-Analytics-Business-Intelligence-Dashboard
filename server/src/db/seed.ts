import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { env } from '../config/env';
import { logger } from '../config/logger';

async function runSeed() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  try {
    const seedPath = path.resolve(__dirname, '../../../database/seed.sql');
    logger.info(`Seeding PostgreSQL database from: ${seedPath}`);
    const sql = fs.readFileSync(seedPath, 'utf-8');

    const client = await pool.connect();
    await client.query(sql);
    client.release();

    logger.info('Database seed data loaded successfully!');
  } catch (err: any) {
    logger.error(`Seeding failed: ${err.message}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSeed();
