import { useQuery } from '@tanstack/react-query';

import { AuthService } from '@/service/auth.service';

export const useMe = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: AuthService.me,
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
};
