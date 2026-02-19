'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, Save, Camera, Lock, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface ProfileResponse {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl: string | null;
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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Editable fields
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // Password change
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        apiClient.get<ProfileResponse>('/api/v1/me/profile')
            .then(data => {
                setProfile(data);
                setName(data?.name || '');
                setBio(data?.mentorProfile?.bio || '');
                setSpecialization(data?.mentorProfile?.specialization || '');
                setAvatarPreview(data?.avatarUrl || null);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Preview
        const reader = new FileReader();
        reader.onloadend = () => setAvatarPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await apiClient.patch('/api/v1/me/profile', {
                name,
                bio,
                specialization,
            });
            toast({ title: 'Saved', description: 'Profile updated successfully.', variant: 'success' });
        } catch {
            toast({ title: 'Error', description: 'Failed to save profile.', variant: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast({ title: 'Error', description: 'New passwords do not match.', variant: 'error' });
            return;
        }
        if (newPassword.length < 6) {
            toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'error' });
            return;
        }
        setIsChangingPassword(true);
        try {
            await apiClient.post('/api/v1/me/password', { currentPassword, newPassword });
            toast({ title: 'Success', description: 'Password changed successfully.', variant: 'success' });
            setShowPasswordSection(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch {
            toast({ title: 'Error', description: 'Failed to change password. Check your current password.', variant: 'error' });
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const initials = (session?.user?.name || 'M').charAt(0).toUpperCase();

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
                <p className="text-muted-foreground mt-1">Manage your mentor profile</p>
            </div>

            <div className="rounded-xl border border-border/50 bg-card p-6 space-y-6">
                {/* Avatar & Basic Info */}
                <div className="flex items-center gap-5 pb-5 border-b border-border/50">
                    <div className="relative group">
                        {avatarPreview ? (
                            <img
                                src={avatarPreview}
                                alt="Avatar"
                                className="h-16 w-16 rounded-full object-cover border-2 border-border/50"
                            />
                        ) : (
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                                {initials}
                            </div>
                        )}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                            <Camera className="h-5 w-5 text-white" />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />
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

                {/* Editable Fields */}
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
                            value={specialization}
                            onChange={(e) => setSpecialization(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm"
                            placeholder="e.g. UX Design, Product Design"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground block mb-1.5">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm"
                            rows={3}
                            placeholder="Tell students about your experience and expertise"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground block mb-1.5">Max Cohorts</label>
                        <input
                            type="text"
                            value={profile?.mentorProfile?.maxCohorts ?? 2}
                            className="w-full px-3 py-2 rounded-lg border border-border/60 bg-muted/30 text-sm text-muted-foreground"
                            readOnly
                        />
                        <p className="text-xs text-muted-foreground mt-1">Configured by admin</p>
                    </div>
                </div>

                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Profile
                </Button>
            </div>

            {/* Password Change Section */}
            <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                            <Lock className="h-4 w-4" /> Change Password
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Update your account password</p>
                    </div>
                    {!showPasswordSection && (
                        <Button variant="outline" size="sm" onClick={() => setShowPasswordSection(true)}>
                            Change Password
                        </Button>
                    )}
                </div>

                {showPasswordSection && (
                    <div className="space-y-3 pt-2">
                        <div className="relative">
                            <label className="text-sm font-medium text-foreground block mb-1.5">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showCurrentPw ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-3 py-2 pr-10 rounded-lg border border-border/60 bg-background text-sm"
                                    placeholder="Enter current password"
                                />
                                <button onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="relative">
                            <label className="text-sm font-medium text-foreground block mb-1.5">New Password</label>
                            <div className="relative">
                                <input
                                    type={showNewPw ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-3 py-2 pr-10 rounded-lg border border-border/60 bg-background text-sm"
                                    placeholder="Enter new password (min 6 characters)"
                                />
                                <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground block mb-1.5">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm"
                                placeholder="Confirm new password"
                            />
                        </div>
                        <div className="flex gap-2 pt-1">
                            <Button onClick={handleChangePassword} disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword} className="gap-2">
                                {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                                Update Password
                            </Button>
                            <Button variant="outline" onClick={() => { setShowPasswordSection(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
