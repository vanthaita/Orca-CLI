import { useMutation } from '@tanstack/react-query';

import { AuthService } from '@/service/auth.service';

export const useCliVerify = () => {
  return useMutation({
    mutationFn: async (userCode: string) => AuthService.cliVerify(userCode),
  });
};
