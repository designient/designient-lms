'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, Save } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface ProfileResponse {
    id: string;
    name: string;
    email: string;
    role: string;
    mentorProfile: {
        id: string;
        specialization: string | null;
        bio: string | null;
        maxCohorts: number;
        status: string;
    } | null;
}

export default function MentorProfilePage() {
    const { data: session } = useSession();
    const { toast } = useToast();
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [name, setName] = useState('');

    useEffect(() => {
        apiClient.get<ProfileResponse>('/api/v1/me/profile')
            .then(data => {
                setProfile(data);
                setName(data?.name || '');
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await apiClient.patch('/api/v1/me/profile', { name });
            toast({ title: 'Saved', description: 'Profile updated.', variant: 'success' });
        } catch {
            toast({ title: 'Error', description: 'Failed to save.', variant: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
                <p className="text-muted-foreground mt-1">Manage your mentor profile</p>
            </div>

            <div className="rounded-xl border border-border/50 bg-card p-6 space-y-5">
                {/* User Info */}
                <div className="flex items-center gap-4 pb-5 border-b border-border/50">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                        {session?.user?.name?.charAt(0) || 'M'}
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-foreground">{session?.user?.name || 'Mentor'}</p>
                        <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
                        {profile?.mentorProfile && (
                            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">
                                {profile.mentorProfile.status}
                            </span>
                        )}
                    </div>
                </div>

                {/* Fields */}
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-foreground block mb-1.5">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm"
                            placeholder="Your name"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground block mb-1.5">Specialization</label>
                        <input
                            type="text"
                            value={profile?.mentorProfile?.specialization || '—'}
                            className="w-full px-3 py-2 rounded-lg border border-border/60 bg-muted/30 text-sm text-muted-foreground"
                            readOnly
                        />
                        <p className="text-xs text-muted-foreground mt-1">Managed by admin</p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground block mb-1.5">Bio</label>
                        <textarea
                            value={profile?.mentorProfile?.bio || '—'}
                            className="w-full px-3 py-2 rounded-lg border border-border/60 bg-muted/30 text-sm text-muted-foreground"
                            rows={3}
                            readOnly
                        />
                        <p className="text-xs text-muted-foreground mt-1">Managed by admin</p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground block mb-1.5">Max Cohorts</label>
                        <input
                            type="text"
                            value={profile?.mentorProfile?.maxCohorts ?? 2}
                            className="w-full px-3 py-2 rounded-lg border border-border/60 bg-muted/30 text-sm text-muted-foreground"
                            readOnly
                        />
                    </div>
                </div>

                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                </Button>
            </div>
        </div>
    );
}
