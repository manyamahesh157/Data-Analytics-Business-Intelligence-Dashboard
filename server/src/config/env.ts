import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/bi_analytics'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().default('production-super-secret-jwt-key-change-me-2026!'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_SECRET: z.string().default('refresh-super-secret-key-2026!'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 mins
  RATE_LIMIT_MAX: z.coerce.number().default(1000),
});

export const env = envSchema.parse(process.env);
