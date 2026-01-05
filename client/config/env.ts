import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_ORCA_API_BASE_URL: z
    .string()
    .url()
    .default('http://localhost:8000')
    .or(z.literal('http://localhost:8000')),
});

const _env = envSchema.safeParse({
  NEXT_PUBLIC_ORCA_API_BASE_URL:
    process.env.NEXT_PUBLIC_ORCA_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL,
});

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;

export const ORCA_API_BASE_URL = env.NEXT_PUBLIC_ORCA_API_BASE_URL;
