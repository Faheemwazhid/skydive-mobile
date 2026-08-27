import { Pool } from 'pg';

import { SCHEMA_SQL } from './schema.ts';

let pool: Pool | null = null;

export function db(): Pool {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. See server/README.md');
  }
  pool = new Pool({ connectionString, max: 5 });
  return pool;
}

/** Idempotent: the schema is CREATE TABLE IF NOT EXISTS throughout. */
export async function migrate(): Promise<void> {
  await db().query(SCHEMA_SQL);
}

export async function queryOne<T>(
  text: string,
  values: unknown[] = [],
): Promise<T | null> {
  const result = await db().query(text, values);
  return (result.rows[0] as T) ?? null;
}

export async function queryAll<T>(
  text: string,
  values: unknown[] = [],
): Promise<T[]> {
  const result = await db().query(text, values);
  return result.rows as T[];
}
