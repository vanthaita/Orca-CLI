import { apiClient } from '@/lib/api-client';
import type { CliVerifyResponse, MeResponse } from '@/interface/auth';
import { NEXT_PUBLIC_PREFIX_API, ORCA_API_BASE_URL } from '@/config/env';
export const AuthService = {
  me: async (): Promise<MeResponse> => {
    return apiClient.get('/auth/me');
  },

  startGoogleLogin: (state?: string): string => {
    const prefix = NEXT_PUBLIC_PREFIX_API.replace(/^\/+/, '');
    const base = ORCA_API_BASE_URL.replace(/\/+$/, '');
    const baseUrl = `${base}/${prefix}/auth/google`;

    if (!state) return baseUrl;
    const s = state.startsWith('/') ? state : `/${state}`;
    return `${baseUrl}?state=${encodeURIComponent(s)}`;
  },

  cliVerify: async (userCode: string): Promise<CliVerifyResponse> => {
    return apiClient.post('/auth/cli/verify', { userCode });
  },
};
