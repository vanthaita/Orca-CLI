import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface LogEntry {
    level?: number;
    time?: number;
    pid?: number;
    hostname?: string;
    msg?: string;
    req?: any;
    res?: any;
    responseTime?: number;
    context?: string;
    [key: string]: any;
}

/**
 * Hook to fetch system logs (admin only)
 */
export function useAdminLogs(lines: number = 100) {
    return useQuery<LogEntry[]>({
        queryKey: ['admin', 'logs', lines],
        queryFn: async () => {
            const response = await apiClient.get(`/admin/logs?lines=${lines}`) as any;
            if (Array.isArray(response)) return response;
            return response.logs || [];
        },
        retry: 1,
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: 10 * 1000, // Auto-refresh every 10 seconds
    });
}
