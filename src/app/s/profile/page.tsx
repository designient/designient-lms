'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import {
    User,
    Mail,
    Phone,
    Calendar,
    MessageCircle,
    Save,
    GraduationCap,
    Lock,
    Eye,
    EyeOff,
} from 'lucide-react';

interface StudentProfileData {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl: string | null;
    createdAt: string;
    studentProfile: {
        id: string;
        phone: string | null;
        whatsappOptIn: boolean;
        enrollmentDate: string;
        status: string;
        cohort: {
            id: string;
            name: string;
            startDate: string;
            endDate: string | null;
        } | null;
    } | null;
}

export default function StudentProfilePage() {
    const { data: session } = useSession();
    const [profile, setProfile] = useState<StudentProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    // Editable fields
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [whatsappOptIn, setWhatsappOptIn] = useState(true);

    // Password change
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    useEffect(() => {
        api.get<StudentProfileData>('/me/profile').then((res) => {
            if (res.success && res.data) {
                setProfile(res.data);
                setName(res.data.name || '');
                setPhone(res.data.studentProfile?.phone || '');
                setWhatsappOptIn(res.data.studentProfile?.whatsappOptIn ?? true);
            }
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const res = await api.patch<StudentProfileData>('/me/profile', {
            name: name.trim(),
            phone: phone.trim(),
            whatsappOptIn,
        });
        if (res.success && res.data) {
            setProfile(res.data);
            toast({
                title: 'Profile updated',
                description: 'Your changes have been saved.',
                variant: 'success',
            });
        } else {
            toast({
                title: 'Error',
                description: 'Failed to save changes.',
                variant: 'error',
            });
        }
        setSaving(false);
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            toast({ title: 'Error', description: 'Please fill in all password fields.', variant: 'error' });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({ title: 'Error', description: 'New passwords do not match.', variant: 'error' });
            return;
        }
        if (newPassword.length < 8) {
            toast({ title: 'Error', description: 'New password must be at least 8 characters.', variant: 'error' });
            return;
        }
        setChangingPassword(true);
        const res = await api.post('/me/password', { currentPassword, newPassword });
        if (res.success) {
            toast({ title: 'Password changed', description: 'Your password has been updated.', variant: 'success' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            toast({
                title: 'Error',
                description: (res.error as { message?: string })?.message || 'Failed to change password.',
                variant: 'error',
            });
        }
        setChangingPassword(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    const initials = name
        ? name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : 'ST';

    const statusColors: Record<string, string> = {
        ACTIVE: 'text-emerald-600 bg-emerald-500/10',
        INVITED: 'text-blue-600 bg-blue-500/10',
        DROPPED: 'text-red-600 bg-red-500/10',
        COMPLETED: 'text-violet-600 bg-violet-500/10',
        FLAGGED: 'text-amber-600 bg-amber-500/10',
    };

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Profile</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage your personal information and preferences
                </p>
            </div>

            {/* Avatar & Identity */}
            <div className="rounded-xl border border-border/50 bg-card p-6">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0">
                        {initials}
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">
                            {profile?.name || 'Student'}
                        </h2>
                        <p className="text-sm text-muted-foreground">{profile?.email}</p>
                        {profile?.studentProfile?.status && (
                            <span
                                className={`inline-block mt-1 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded ${
                                    statusColors[profile.studentProfile.status] ||
                                    'text-muted-foreground bg-muted/50'
                                }`}
                            >
                                {profile.studentProfile.status}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Cohort Info (read-only) */}
            {profile?.studentProfile?.cohort && (
                <div className="rounded-xl border border-border/50 bg-card p-6">
                    <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-primary" />
                        Cohort Assignment
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Cohort</p>
                            <p className="text-sm font-medium text-foreground">
                                {profile.studentProfile.cohort.name}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Enrolled</p>
                            <p className="text-sm font-medium text-foreground">
                                {new Date(
                                    profile.studentProfile.enrollmentDate
                                ).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Start Date</p>
                            <p className="text-sm font-medium text-foreground">
                                {new Date(
                                    profile.studentProfile.cohort.startDate
                                ).toLocaleDateString()}
                            </p>
                        </div>
                        {profile.studentProfile.cohort.endDate && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">End Date</p>
                                <p className="text-sm font-medium text-foreground">
                                    {new Date(
                                        profile.studentProfile.cohort.endDate
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Editable Fields */}
            <div className="rounded-xl border border-border/50 bg-card p-6 space-y-5">
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Personal Information
                </h3>

                {/* Name */}
                <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1.5">
                        <User className="h-3 w-3 text-muted-foreground" />
                        Full Name
                    </label>
                    <input
                        type="text"
                        className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                    />
                </div>

                {/* Email (read-only) */}
                <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1.5">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        Email
                    </label>
                    <input
                        type="email"
                        className="w-full rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                        value={profile?.email || ''}
                        disabled
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                        Contact your administrator to change your email.
                    </p>
                </div>

                {/* Phone */}
                <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1.5">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        Phone Number
                    </label>
                    <input
                        type="tel"
                        className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                    />
                </div>

                {/* WhatsApp Opt-in */}
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-emerald-500" />
                        <div>
                            <p className="text-sm font-medium text-foreground">
                                WhatsApp Notifications
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Receive updates via WhatsApp
                            </p>
                        </div>
                    </label>
                    <button
                        onClick={() => setWhatsappOptIn(!whatsappOptIn)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            whatsappOptIn ? 'bg-emerald-500' : 'bg-muted'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                                whatsappOptIn ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>

                {/* Account Info */}
                <div className="pt-3 border-t border-border/30">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Account created{' '}
                        {profile?.createdAt
                            ? new Date(profile.createdAt).toLocaleDateString()
                            : '—'}
                    </div>
                </div>
            </div>

            {/* Change Password */}
            <div className="rounded-xl border border-border/50 bg-card p-6 space-y-5">
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    Change Password
                </h3>

                <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1.5">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        Current Password
                    </label>
                    <div className="relative">
                        <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                        >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1.5">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        New Password
                    </label>
                    <div className="relative">
                        <input
                            type={showNewPassword ? 'text' : 'password'}
                            className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                        >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        Min 8 characters, one uppercase letter, one number.
                    </p>
                </div>

                <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1.5">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        Confirm New Password
                    </label>
                    <input
                        type="password"
                        className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground/10 text-foreground text-sm font-medium hover:bg-foreground/15 transition-colors disabled:opacity-50"
                        onClick={handleChangePassword}
                        disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                    >
                        <Lock className="h-3.5 w-3.5" />
                        {changingPassword ? 'Changing...' : 'Change Password'}
                    </button>
                </div>
            </div>

            {/* Save button */}
            <div className="flex justify-end">
                <button
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    onClick={handleSave}
                    disabled={saving}
                >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}
