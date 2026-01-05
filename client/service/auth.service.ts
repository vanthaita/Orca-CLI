import { apiClient } from '@/lib/api-client';
import type { CliVerifyResponse, MeResponse } from '@/interface/auth';

export const AuthService = {
  me: async (): Promise<MeResponse> => {
    return apiClient.get('/auth/me');
  },

  startGoogleLogin: (state?: string): string => {
    if (!state) return '/api/v1/auth/google';
    const s = state.startsWith('/') ? state : `/${state}`;
    return `/api/v1/auth/google?state=${encodeURIComponent(s)}`;
  },

  cliVerify: async (userCode: string): Promise<CliVerifyResponse> => {
    return apiClient.post('/auth/cli/verify', { userCode });
  },
};
