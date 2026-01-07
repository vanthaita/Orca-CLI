import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface User {
    id: string;
    email: string | null;
    name: string | null;
    picture: string | null;
    googleId: string | null;
    plan: string;
    role: string;
    planExpiresAt: string | null;
    teamId: string | null;
    dailyRequestLimit: number | null;
    byokProvider: string | null;
    createdAt: string;
    updatedAt: string;
}

/**
 * Hook to fetch all users (admin only)
 */
export function useAdminUsers() {
    return useQuery<User[]>({
        queryKey: ['admin', 'users'],
        queryFn: async () => {
            return await apiClient.get('/admin/users');
        },
        retry: 1,
        staleTime: 1 * 60 * 1000, // 1 minute
    });
}
