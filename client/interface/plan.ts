export interface PlanInfo {
    plan: 'free' | 'pro' | 'team';
    name: string;
    dailyAiLimit: number | null;
    features: string[];
    isActive: boolean;
    expiresAt?: string;
}

export interface UsageStats {
    day: string;
    requestCount: number;
    dailyLimit: number | null;
    remaining: number | null;
}

export interface TeamInfo {
    id: string;
    name: string;
    memberCount: number;
    maxMembers: number;
    members: TeamMember[];
}

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: string;
}
