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
        retry: 0, // Don't retry auth requests - let interceptor handle refresh
        staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes (reduced from 5)
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: false,
    });
}
