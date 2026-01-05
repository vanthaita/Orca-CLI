import { apiClient } from '@/lib/api-client';
import type { CliVerifyResponse, MeResponse } from '@/interface/auth';
import { NEXT_PUBLIC_PREFIX_API } from '@/config/env';
export const AuthService = {
  me: async (): Promise<MeResponse> => {
    return apiClient.get('/auth/me');
  },

  startGoogleLogin: (state?: string): string => {
    if (!state) return `${NEXT_PUBLIC_PREFIX_API}/auth/google`;
    const s = state.startsWith('/') ? state : `/${state}`;
    return `${NEXT_PUBLIC_PREFIX_API}/auth/google?state=${encodeURIComponent(s)}`;
  },

  cliVerify: async (userCode: string): Promise<CliVerifyResponse> => {
    return apiClient.post('/auth/cli/verify', { userCode });
  },
};
