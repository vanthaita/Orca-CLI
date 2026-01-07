import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { UsageStats } from '@/interface/plan';

/**
 * Hook to fetch the current user's usage statistics
 * @returns Query result with usage data, loading state, and error state
 */
export function useUsage() {
    return useQuery({
        queryKey: ['user', 'usage'],
        queryFn: async (): Promise<UsageStats> => {
            return await apiClient.get('/user/usage');
        },
        retry: 1,
        staleTime: 30 * 1000, // Refresh every 30 seconds
        refetchInterval: 60 * 1000, // Auto-refetch every minute
        refetchOnWindowFocus: true,
    });
}
