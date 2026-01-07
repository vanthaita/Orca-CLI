import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface CliToken {
    id: string;
    label: string;
    deviceName: string | null;
    deviceFingerprint: string | null;
    ipAddress: string | null;
    lastUsedAt: string | null;
    createdAt: string;
    expiresAt: string;
    revokedAt: string | null;
}

interface CliTokensResponse {
    tokens: CliToken[];
}

/**
 * Hook to fetch CLI tokens list
 */
export function useCliTokens() {
    return useQuery({
        queryKey: ['auth', 'cli-tokens'],
        queryFn: async (): Promise<CliToken[]> => {
            const response: any = await apiClient.get('/auth/cli/tokens');
            return response.tokens || [];
        },
        retry: 1,
        staleTime: 30 * 1000, // 30 seconds
        refetchOnWindowFocus: true,
    });
}

/**
 * Hook to revoke a CLI token
 */
export function useRevokeToken() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (tokenId: string) => {
            return await apiClient.post(`/auth/cli/tokens/${tokenId}/revoke`);
        },
        onSuccess: () => {
            // Invalidate tokens list to refetch
            queryClient.invalidateQueries({ queryKey: ['auth', 'cli-tokens'] });
        },
    });
}

/**
 * Hook to rename a CLI token
 */
export function useRenameToken() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ tokenId, name }: { tokenId: string; name: string }) => {
            return await apiClient.post(`/auth/cli/tokens/${tokenId}/rename`, { name });
        },
        onSuccess: () => {
            // Invalidate tokens list to refetch
            queryClient.invalidateQueries({ queryKey: ['auth', 'cli-tokens'] });
        },
    });
}
