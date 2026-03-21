import { ENV } from "./env.config.js";

export const REDIS_CONFIG = {
  commandTimeout: 5000,
  connectTimeout: 10000,
  db: 0,
  host: ENV.REDIS_HOST,
  keepAlive: true,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  password: ENV.REDIS_PASSWORD,
  port: ENV.REDIS_PORT,
  retryDelayOnFailover: 100,
  tls: ENV.REDIS_TLS ? {} : undefined,
};
