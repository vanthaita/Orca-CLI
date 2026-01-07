import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { TeamInfo } from '@/interface/plan';

/**
 * Hook to fetch the current user's team information
 * @returns Query result with team data, loading state, and error state
 */
export function useTeam() {
    return useQuery({
        queryKey: ['user', 'team'],
        queryFn: async (): Promise<TeamInfo> => {
            return await apiClient.get('/user/team');
        },
        retry: 1,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        // Only enable this query if user has team plan
        enabled: false, // Will be enabled conditionally in component
    });
}
