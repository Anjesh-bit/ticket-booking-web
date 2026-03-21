import dotenv from "dotenv";
import { z } from "zod";

import { ENVIRONMENT } from "#constants/env.constant.js";

dotenv.config({ path: `.env.${process.env.NODE_ENV ?? "development"}` });

const envSchema = z.object({
  NODE_ENV: z.enum(ENVIRONMENT).default("development"),
  PORT: z.string().transform(Number).default(5000),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.string().transform(Number).default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TLS: z
    .string()
    .transform((val) => val === "true")
    .default(false),
});

export const ENV = envSchema.parse(process.env);
