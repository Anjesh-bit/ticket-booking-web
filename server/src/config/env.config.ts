import dotenv from "dotenv";
import { z } from "zod";

import { ENVIRONMENT } from "#constants/env.constant.js";

dotenv.config({ path: `.env.${process.env.NODE_ENV ?? "development"}` });

const envSchema = z.object({
  CLIENT_URL: z.string().min(1, "CLIENT_URL is required").default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DB_NAME is required").default("real_estate_portal"),
  NODE_ENV: z.enum(ENVIRONMENT).default("development"),
  PORT: z.string().transform(Number).default(5000),
  WINDOW_MS: z.string().default((15 * 60 * 1000).toString()),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_PORT: z.string().transform(Number).default(6379),
  REDIS_DEV_PASSWORD: z.string().optional(),
  REDIS_DEV_HOST: z.string().default("localhost"),
  REDIS_DEV_PORT: z.string().transform(Number).default(6379),
  REDIS_TEST_PASSWORD: z.string().optional(),
  REDIS_TEST_HOST: z.string().default("localhost"),
  REDIS_TEST_PORT: z.string().transform(Number).default(6380),
  REDIS_TLS: z.string().default("false"),
  COOKIE_DOMAIN: z.string().default("localhost"),
});

export const ENV = envSchema.parse(process.env);
