import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { TeamInfo } from '@/interface/plan';

interface CreateTeamParams {
    name: string;
}

/**
 * Hook to create a new team
 * @returns Mutation for creating a team
 */
export function useCreateTeam() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: CreateTeamParams): Promise<TeamInfo> => {
            return await apiClient.post('/team', params);
        },
        onSuccess: () => {
            // Invalidate team query to refetch team data
            queryClient.invalidateQueries({ queryKey: ['user', 'team'] });
            // Also invalidate user info as it might include teamId
            queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        },
    });
}
