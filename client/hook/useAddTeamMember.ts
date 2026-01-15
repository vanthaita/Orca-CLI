import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface AddMemberParams {
    email: string;
}

interface AddMemberResponse {
    id: string;
    email: string;
    name: string;
    teamId: string;
}

/**
 * Hook to add a member to the team
 * @returns Mutation for adding team members
 */
export function useAddTeamMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: AddMemberParams): Promise<AddMemberResponse> => {
            return await apiClient.post('/team/members', params);
        },
        onSuccess: () => {
            // Invalidate team query to refetch updated member list
            queryClient.invalidateQueries({ queryKey: ['user', 'team'] });
        },
    });
}
