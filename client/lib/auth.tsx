'use client';

import { createContext, useContext, ReactNode } from 'react';

import type { ProjectUser } from '@/interface/auth';
import { useMe } from '@/hook/useMe';

interface AuthContextType {
    user: ProjectUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const me = useMe();
    const user = me.data?.user ?? null;

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading: me.isLoading,
                isAuthenticated: !!user,
                refetch: async () => {
                    await me.refetch();
                },
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
