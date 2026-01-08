export interface UserProfile {
    id: string;
    email: string | null;
    name: string | null;
    picture: string | null;
    plan: 'free' | 'pro' | 'team';
    role: 'user' | 'admin';
    planExpiresAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateProfileDto {
    name?: string;
}

export interface PlanInfo {
    name: string;
    dailyAiLimit: number | null;
    features: string[];
    isActive: boolean;
    expiresAt: string | null;
}

export interface UsageInfo {
    day: string;
    requestCount: number;
    dailyLimit: number | null;
    remaining: number | null;
}

export interface AdminUser extends UserProfile {
    // Same as UserProfile for now
}

export interface UpdateRoleDto {
    role: 'user' | 'admin';
}

export interface UpdatePlanDto {
    plan: 'free' | 'pro' | 'team';
    planExpiresAt?: string | null;
}

export interface SystemMetrics {
    totalUsers: number;
    usersByPlan: Array<{ plan: string; count: number }>;
    usersByRole: Array<{ role: string; count: number }>;
    aiUsage: {
        today: string;
        totalRequests: number;
    };
    recentSignups: {
        last7Days: number;
    };
}

export interface PaymentTransaction {
    id: string;
    amount: number;
    plan: string | null;
    duration: string | null;
    status: 'pending' | 'processed' | 'failed';
    transactionDate: string;
    gateway: string;
    referenceCode: string | null;
}

export interface PaymentStats {
    total: number;
    processed: number;
    failed: number;
    pending: number;
    totalRevenue: number;
}
