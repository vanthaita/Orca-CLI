'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ORCA_API_BASE_URL } from '@/config/env';

interface User {
    id: string;
    email: string | null;
    name: string | null;
    picture: string | null;
    plan: string;
    createdAt: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(new Error('Request timed out')), 10000); // 10s timeout

        try {
            console.log('[Auth] Checking authentication...', `${ORCA_API_BASE_URL}/api/v1/auth/me`);
            const res = await fetch(`${ORCA_API_BASE_URL}/api/v1/auth/me`, {
                credentials: 'include',
                signal: controller.signal,
            });

            if (res.ok) {
                const data = await res.json();
                console.log('[Auth] Authenticated user:', data.user?.email);
                setUser(data.user);
            } else {
                console.log('[Auth] Not authenticated (status):', res.status);
                setUser(null);
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.warn('[Auth] Auth check timed out. Is the server running?');
            } else {
                console.error('[Auth] Failed to fetch user:', error);
            }
            setUser(null);
        } finally {
            clearTimeout(timeoutId);
            setIsLoading(false);
            console.log('[Auth] Check finished');
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                refetch: fetchUser,
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
