'use client';

import { useState } from 'react';
import { useCreateTeam } from '@/hook/useCreateTeam';

interface CreateTeamFormProps {
    onSuccess?: () => void;
}

export default function CreateTeamForm({ onSuccess }: CreateTeamFormProps) {
    const [teamName, setTeamName] = useState('');
    const createTeam = useCreateTeam();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!teamName.trim()) {
            return;
        }

        createTeam.mutate(
            { name: teamName.trim() },
            {
                onSuccess: () => {
                    setTeamName('');
                    onSuccess?.();
                },
            }
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="teamName" className="block text-sm font-medium text-neutral-300 mb-2">
                    Team Name
                </label>
                <input
                    id="teamName"
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter your team name"
                    maxLength={255}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    disabled={createTeam.isPending}
                />
            </div>

            {createTeam.isError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
                    {(createTeam.error as any)?.message || 'Failed to create team. Please try again.'}
                </div>
            )}

            <button
                type="submit"
                disabled={createTeam.isPending || !teamName.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
                {createTeam.isPending ? (
                    <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating...
                    </>
                ) : (
                    'Create Team'
                )}
            </button>
        </form>
    );
}
