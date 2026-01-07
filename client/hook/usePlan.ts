import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PlanInfo } from '@/interface/plan';

/**
 * Hook to fetch the current user's plan information
 * @returns Query result with plan data, loading state, and error state
 */
export function usePlan() {
    return useQuery({
        queryKey: ['user', 'plan'],
        queryFn: async (): Promise<PlanInfo> => {
            return await apiClient.get('/user/plan');
        },
        retry: 1,
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        refetchOnWindowFocus: false,
    });
}
