import { ENV } from "./env.config.js";

type Env = "development" | "production" | "test";

const REDIS = {
  development: {
    commandTimeout: 5000,
    connectTimeout: 10000,
    db: 0,
    host: ENV.REDIS_DEV_HOST ?? "localhost",
    keepAlive: true,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    password: ENV.REDIS_DEV_PASSWORD ?? undefined,
    port: ENV.REDIS_DEV_PORT || 6379,
    retryDelayOnFailover: 100,
  },

  production: {
    commandTimeout: 5000,
    connectTimeout: 10000,
    db: 0,
    host: ENV.REDIS_HOST ?? "localhost",
    keepAlive: true,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    password: ENV.REDIS_PASSWORD ?? undefined,
    port: ENV.REDIS_PORT || 6379,
    retryDelayOnFailover: 100,
    tls: ENV.REDIS_TLS === "true" ? {} : undefined,
  },

  test: {
    commandTimeout: 5000,
    connectTimeout: 10000,
    db: 1,
    host: ENV.REDIS_TEST_HOST ?? "localhost",
    keepAlive: true,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    password: ENV.REDIS_TEST_PASSWORD ?? undefined,
    port: ENV.REDIS_TEST_PORT || 6380,
    retryDelayOnFailover: 100,
  },
};

const env = (process.env.NODE_ENV as Env) || "development";

export const REDIS_CONFIG = REDIS[env];
