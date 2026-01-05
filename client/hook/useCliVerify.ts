import { useMutation } from '@tanstack/react-query';

import { AuthService } from '@/service/auth.service';

export const useCliVerify = () => {
  return useMutation({
    mutationFn: async (userCode: string) => AuthService.cliVerify(userCode),
    onMutate: (userCode: string) => {
      // eslint-disable-next-line no-console
      console.log('[useCliVerify] mutate', { userCode });
    },
    onSuccess: (data, userCode) => {
      // eslint-disable-next-line no-console
      console.log('[useCliVerify] success', { userCode, data });
    },
    onError: (error, userCode) => {
      // eslint-disable-next-line no-console
      console.log('[useCliVerify] error', { userCode, error });
    },
  });
};
