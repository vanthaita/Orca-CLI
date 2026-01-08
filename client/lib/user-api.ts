import { apiClient } from './api-client';
import { UserProfile, UpdateProfileDto, PlanInfo, UsageInfo } from '@/interface/types';


export async function getUserProfile(): Promise<{ user: UserProfile }> {
    return apiClient.get('/user/me');
}

export async function updateUserProfile(data: UpdateProfileDto): Promise<{
    ok: boolean;
    message: string;
    user: UserProfile;
}> {
    return apiClient.patch('/user/profile', data);
}

export async function getUserPlan(): Promise<PlanInfo> {
    return apiClient.get('/user/plan');
}


export async function getUserFeatures(): Promise<{ features: string[] }> {
    return apiClient.get('/user/features');
}


export async function getUserUsage(): Promise<UsageInfo> {
    return apiClient.get('/user/usage');
}
