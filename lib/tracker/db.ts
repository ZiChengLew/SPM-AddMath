import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __tracker_pg_pool__: Pool | undefined;
}

export function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Please configure your Postgres connection string.');
  }

  if (!global.__tracker_pg_pool__) {
    global.__tracker_pg_pool__ = new Pool({
      connectionString
    });
  }

  return global.__tracker_pg_pool__;
}

export async function withConnection<T>(fn: (pool: Pool) => Promise<T>): Promise<T> {
  const pool = getPool();
  return fn(pool);
}
