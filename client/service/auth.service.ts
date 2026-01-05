import { http } from '@/service/http';
import type { CliVerifyResponse, MeResponse } from '@/interface/auth';

export const AuthService = {
  me: async (): Promise<MeResponse> => {
    const { data } = await http.get<MeResponse>('/auth/me', {
      params: { _t: Date.now() },
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
    return data;
  },

  startGoogleLogin: (state?: string): string => {
    if (!state) return '/api/v1/auth/google';
    const s = state.startsWith('/') ? state : `/${state}`;
    return `/api/v1/auth/google?state=${encodeURIComponent(s)}`;
  },

  cliVerify: async (userCode: string): Promise<CliVerifyResponse> => {
    const { data } = await http.post<CliVerifyResponse>('/auth/cli/verify', { userCode });
    return data;
  },
};
