import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { performLogout } from '@/lib/auth-utils';

/**
 * Hook to handle user logout
 * Calls the server logout endpoint and clears all cached data
 */
export function useLogout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            try {
                await apiClient.post('/auth/logout');
            } catch (error) {
                // Even if server call fails, we want to clear client-side state
                console.error('Logout error:', error);
            }
        },
        onSuccess: () => {
            // Clear all React Query cache
            queryClient.clear();

            // Use centralized logout function
            performLogout();
        },
    });
}
