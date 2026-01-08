import { apiClient } from './api-client';
import { AdminUser, UpdateRoleDto, UpdatePlanDto, SystemMetrics } from '@/interface/types';

/**
 * Get all users (admin only)
 */
export async function getAllUsers(): Promise<{ users: AdminUser[] }> {
    return apiClient.get('/admin/users');
}

/**
 * Get single user by ID (admin only)
 */
export async function getUser(id: string): Promise<{ user: AdminUser }> {
    return apiClient.get(`/admin/users/${id}`);
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(id: string, role: 'user' | 'admin'): Promise<{
    ok: boolean;
    message: string;
    user: AdminUser;
}> {
    return apiClient.patch(`/admin/users/${id}/role`, { role });
}

/**
 * Update user plan (admin only)
 */
export async function updateUserPlan(
    id: string,
    plan: 'free' | 'pro' | 'team',
    planExpiresAt?: string | null
): Promise<{
    ok: boolean;
    message: string;
    user: AdminUser;
}> {
    return apiClient.patch(`/admin/users/${id}/plan`, { plan, planExpiresAt });
}

/**
 * Get system metrics (admin only)
 */
export async function getSystemMetrics(): Promise<SystemMetrics> {
    return apiClient.get('/admin/metrics');
}

/**
 * Get system logs (admin only)
 */
export async function getSystemLogs(lines: number = 100): Promise<any> {
    return apiClient.get(`/admin/logs?lines=${lines}`);
}
