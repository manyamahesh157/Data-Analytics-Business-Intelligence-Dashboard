import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { env } from '../config/env';
import { logger } from '../config/logger';

async function runMigration() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  try {
    const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
    logger.info(`Running PostgreSQL schema migration from: ${schemaPath}`);
    const sql = fs.readFileSync(schemaPath, 'utf-8');

    const client = await pool.connect();
    await client.query(sql);
    client.release();

    logger.info('Database schema migration applied successfully!');
  } catch (err: any) {
    logger.error(`Migration failed: ${err.message}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
