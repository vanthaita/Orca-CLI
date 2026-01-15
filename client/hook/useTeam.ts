import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { TeamInfo } from '@/interface/plan';

interface UseTeamOptions {
    enabled?: boolean;
}

/**
 * Hook to fetch the current user's team information
 * @param options - Query options including enabled flag
 * @returns Query result with team data, loading state, and error state
 */
export function useTeam(options?: UseTeamOptions) {
    return useQuery({
        queryKey: ['user', 'team'],
        queryFn: async (): Promise<TeamInfo> => {
            return await apiClient.get('/team');
        },
        retry: 1,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        enabled: options?.enabled ?? false,
    });
}
