'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, User, Save } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface MentorProfileData {
    id: string;
    specialization: string;
    bio: string;
    phone: string;
    maxCohorts: number;
    status: string;
}

export default function MentorProfilePage() {
    const { data: session } = useSession();
    const { toast } = useToast();
    const [profile, setProfile] = useState<MentorProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        apiClient.get<MentorProfileData>('/api/v1/me/profile')
            .then(setProfile)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    const handleSave = async () => {
        if (!profile) return;
        setIsSaving(true);
        try {
            await apiClient.put('/api/v1/me/profile', {
                specialization: profile.specialization,
                bio: profile.bio,
                phone: profile.phone,
            });
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
                {/* User Info (read-only) */}
                <div className="flex items-center gap-4 pb-5 border-b border-border/50">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                        {session?.user?.name?.charAt(0) || 'M'}
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-foreground">{session?.user?.name || 'Mentor'}</p>
                        <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
                    </div>
                </div>

                {/* Editable fields */}
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-foreground block mb-1.5">Specialization</label>
                        <input
                            type="text"
                            value={profile?.specialization || ''}
                            onChange={(e) => setProfile(prev => prev ? { ...prev, specialization: e.target.value } : prev)}
                            className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm"
                            placeholder="e.g., Full-Stack Development"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground block mb-1.5">Bio</label>
                        <textarea
                            value={profile?.bio || ''}
                            onChange={(e) => setProfile(prev => prev ? { ...prev, bio: e.target.value } : prev)}
                            className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm"
                            rows={4}
                            placeholder="Tell students about yourself..."
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground block mb-1.5">Phone</label>
                        <input
                            type="tel"
                            value={profile?.phone || ''}
                            onChange={(e) => setProfile(prev => prev ? { ...prev, phone: e.target.value } : prev)}
                            className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm"
                            placeholder="+91 xxxx xxx xxx"
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
