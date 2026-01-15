'use client';

import { useState } from 'react';
import { useAddTeamMember } from '@/hook/useAddTeamMember';

interface AddMemberFormProps {
    currentMemberCount: number;
    maxMembers: number;
    onSuccess?: () => void;
}

export default function AddMemberForm({ currentMemberCount, maxMembers, onSuccess }: AddMemberFormProps) {
    const [email, setEmail] = useState('');
    const addMember = useAddTeamMember();

    const remainingSlots = maxMembers - currentMemberCount;
    const isFull = remainingSlots <= 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || isFull) {
            return;
        }

        addMember.mutate(
            { email: email.trim() },
            {
                onSuccess: () => {
                    setEmail('');
                    onSuccess?.();
                },
            }
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label htmlFor="memberEmail" className="block text-sm font-medium text-neutral-300">
                        Member Email
                    </label>
                    <span className="text-xs text-neutral-500">
                        {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining
                    </span>
                </div>
                <input
                    id="memberEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="member@example.com"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    disabled={addMember.isPending || isFull}
                />
            </div>

            {isFull && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-400">
                    Team is full. Maximum {maxMembers} members allowed.
                </div>
            )}

            {remainingSlots === 1 && !isFull && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-400">
                    ⚠️ Only 1 slot remaining
                </div>
            )}

            {addMember.isError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
                    {(addMember.error as any)?.message || 'Failed to add member. Please check the email and try again.'}
                </div>
            )}

            {addMember.isSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-sm text-emerald-400">
                    Member added successfully!
                </div>
            )}

            <button
                type="submit"
                disabled={addMember.isPending || !email.trim() || isFull}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
                {addMember.isPending ? (
                    <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Adding...
                    </>
                ) : (
                    'Add Member'
                )}
            </button>
        </form>
    );
}
