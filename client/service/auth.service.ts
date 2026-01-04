import { http } from '@/service/http';
import type { CliVerifyResponse, MeResponse } from '@/interface/auth';

export const AuthService = {
  me: async (): Promise<MeResponse> => {
    const { data } = await http.get<MeResponse>('/auth/me');
    return data;
  },

  startGoogleLogin: async (): Promise<string> => {
    return `${http.defaults.baseURL?.replace(/\/+$/, '')}/auth/google`;
  },

  cliVerify: async (userCode: string): Promise<CliVerifyResponse> => {
    const { data } = await http.post<CliVerifyResponse>('/auth/cli/verify', { userCode });
    return data;
  },
};
