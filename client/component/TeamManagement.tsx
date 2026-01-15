'use client';

import { Users, Crown, User as UserIcon, Calendar } from 'lucide-react';
import { useTeam } from '@/hook/useTeam';
import CreateTeamForm from './CreateTeamForm';
import AddMemberForm from './AddMemberForm';
import type { ProjectUser } from '@/interface/auth';

interface TeamManagementProps {
    user: ProjectUser;
}

export default function TeamManagement({ user }: TeamManagementProps) {
    const team = useTeam({ enabled: user.plan === 'team' });

    if (!team.data && team.isLoading) {
        return (
            <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
                <div className="p-6 border-b border-neutral-800">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-emerald-400" />
                        Team Management
                    </h2>
                </div>
                <div className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-12 bg-neutral-800 rounded-lg" />
                        <div className="h-12 bg-neutral-800 rounded-lg" />
                    </div>
                </div>
            </div>
        );
    }

    // User doesn't have a team yet
    if (!team.data) {
        return (
            <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
                <div className="p-6 border-b border-neutral-800 bg-gradient-to-r from-neutral-900 to-neutral-900/50">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-emerald-400" />
                        Team Management
                    </h2>
                </div>
                <div className="p-6">
                    <div className="text-center py-8 mb-6">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Create Your Team</h3>
                        <p className="text-sm text-neutral-400 max-w-md mx-auto">
                            Start collaborating with your team. You can invite up to 5 members to join your team.
                        </p>
                    </div>
                    <div className="max-w-md mx-auto">
                        <CreateTeamForm onSuccess={() => team.refetch()} />
                    </div>
                </div>
            </div>
        );
    }

    // User has a team
    const isLeader = team.data.members?.some(m => m.id === user.id && m.role === 'owner');

    return (
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
            <div className="p-6 border-b border-neutral-800 bg-gradient-to-r from-neutral-900 to-neutral-900/50">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-emerald-400" />
                        Team Management
                    </h2>
                    <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
                        {team.data.memberCount}/{team.data.maxMembers} Members
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Team Info */}
                <div className="bg-neutral-800/30 rounded-lg p-4 border border-neutral-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-white text-lg mb-1">{team.data.name}</h3>
                            <p className="text-sm text-neutral-400">Team ID: {team.data.id.slice(0, 8)}...</p>
                        </div>
                        {isLeader && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full border border-amber-500/20">
                                <Crown className="w-3.5 h-3.5" />
                                Leader
                            </div>
                        )}
                    </div>
                </div>

                {/* Team Members */}
                <div>
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        Team Members
                    </h4>
                    <div className="space-y-2">
                        {team.data.members?.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between p-3 bg-neutral-800/30 rounded-lg border border-neutral-800 hover:bg-neutral-800/50 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <div className="font-medium text-white truncate">{member.name}</div>
                                        {member.role === 'owner' && (
                                            <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                        )}
                                    </div>
                                    <div className="text-xs text-neutral-500 truncate">{member.email}</div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                    <Calendar className="w-3 h-3" />
                                    <span>{new Date(member.joinedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Add Member Form (only for leader) */}
                {isLeader && (
                    <div>
                        <h4 className="text-sm font-bold text-white mb-3">Add New Member</h4>
                        <AddMemberForm
                            currentMemberCount={team.data.memberCount}
                            maxMembers={team.data.maxMembers}
                            onSuccess={() => team.refetch()}
                        />
                    </div>
                )}

                {!isLeader && (
                    <div className="bg-neutral-800/30 border border-neutral-800 rounded-lg p-4 text-center">
                        <p className="text-sm text-neutral-400">
                            Only the team leader can add new members.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
