import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

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

            // Clear cookies (backup in case server didn't)
            document.cookie = 'accessToken=; path=/; max-age=0';
            document.cookie = 'refreshToken=; path=/api/v1/auth; max-age=0';

            // Redirect to home
            window.location.href = '/';
        },
    });
}
