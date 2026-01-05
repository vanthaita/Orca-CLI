import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_ORCA_API_BASE_URL: z
    .string()
    .url()
    .default('http://localhost:8000')
    .or(z.literal('http://localhost:8000')),
  NEXT_PUBLIC_PREFIX_API: z.string().default('api/v1'),
});

const _env = envSchema.safeParse({
  NEXT_PUBLIC_ORCA_API_BASE_URL:
    process.env.NEXT_PUBLIC_ORCA_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_PREFIX_API: process.env.NEXT_PUBLIC_PREFIX_API,
});

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;

let apiBaseUrl = env.NEXT_PUBLIC_ORCA_API_BASE_URL;
let prefixApi = env.NEXT_PUBLIC_PREFIX_API;
// Fix mixed content error: ensure https for production domain
if (apiBaseUrl.includes('orcacli.codes') && apiBaseUrl.startsWith('http://')) {
  apiBaseUrl = apiBaseUrl.replace('http://', 'https://');
}

export const ORCA_API_BASE_URL = apiBaseUrl;
export const NEXT_PUBLIC_PREFIX_API = prefixApi;
