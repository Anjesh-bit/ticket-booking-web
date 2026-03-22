import type { PoolClient, QueryResult } from "pg";
import { Pool } from "pg";

import { ENV } from "#config/env.config";
import logger from "#lib/helpers/winston.helpers.js";

export const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (error: Error | unknown) => {
  logger.error("Postgres pool error:", error);
});

export const connectDb = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    logger.info("Connected to Postgres");
  } finally {
    client.release();
  }
};

export const disconnectDb = async (): Promise<void> => {
  await pool.end();
  logger.info("Postgres pool closed");
};

export const query = <T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<QueryResult<T>> => pool.query<T>(sql, params);

/* 
   Wraps a callback in a Postgres transaction.
   BEGIN → callback → COMMIT on success, ROLLBACK on error.
   Uses a dedicated client from the pool — required for SELECT FOR UPDATE
   since locks must stay on the same connection for the duration.
   
 */
export const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
