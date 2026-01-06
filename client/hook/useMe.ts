import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { MeResponse } from '@/interface/auth';

/**
 * Hook to fetch the current authenticated user
 * @returns Query result with user data, loading state, and error state
 */
export function useMe() {
    return useQuery({
        queryKey: ['auth', 'me'],
        queryFn: async (): Promise<MeResponse> => {
            return await apiClient.get('/auth/me');
        },
        retry: 1,
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        refetchOnWindowFocus: false,
    });
}
