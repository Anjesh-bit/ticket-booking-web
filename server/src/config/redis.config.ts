import type { RedisClientOptions } from "redis";

import { ENV } from "./env.config.js";

const RECONNECT_DELAYS = [100, 200, 400, 800, 1600, 3000] as const;
const MAX_RETRIES = RECONNECT_DELAYS.length;

const reconnectStrategy = (retries: number): number | Error => {
  if (retries >= MAX_RETRIES) {
    return new Error(`Redis connection failed after ${MAX_RETRIES} attempts`);
  }
  return RECONNECT_DELAYS[retries];
};

export const REDIS_CONFIG: RedisClientOptions = {
  socket: {
    host: ENV.REDIS_HOST,
    port: ENV.REDIS_PORT,
    ...(ENV.REDIS_TLS && { tls: true as const }),
    reconnectStrategy,
  },
  password: ENV.REDIS_PASSWORD || undefined,
  database: 0,
  pingInterval: 30000,
  commandsQueueMaxLength: 100,
};
