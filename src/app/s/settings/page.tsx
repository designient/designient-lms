'use client';

import { useEffect, useState } from 'react';
import { Bell, Loader2, Lock, MessageCircle, Monitor, Moon, Save, Sun } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useTheme, type Theme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/Toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

interface StudentSettingsProfile {
    emailNotifications: boolean;
    pushNotifications: boolean;
    studentProfile?: {
        whatsappOptIn?: boolean;
    } | null;
}

const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
    { value: 'system', label: 'Auto', icon: <Monitor className="h-4 w-4" /> },
];

export default function StudentSettingsPage() {
    const { toast } = useToast();
    const { theme, setTheme } = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingPrefs, setIsSavingPrefs] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [whatsappOptIn, setWhatsappOptIn] = useState(true);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        async function load() {
            try {
                const profile = await apiClient.get<StudentSettingsProfile>('/api/v1/me/profile');
                setEmailNotifications(profile.emailNotifications ?? true);
                setPushNotifications(profile.pushNotifications ?? true);
                setWhatsappOptIn(profile.studentProfile?.whatsappOptIn ?? true);
            } catch {
                toast({ title: 'Error', description: 'Failed to load settings.', variant: 'error' });
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    const handleSaveNotifications = async () => {
        setIsSavingPrefs(true);
        try {
            await apiClient.patch('/api/v1/me/profile', {
                emailNotifications,
                pushNotifications,
                whatsappOptIn,
            });
            toast({ title: 'Saved', description: 'Notification preferences updated.', variant: 'success' });
        } catch {
            toast({ title: 'Error', description: 'Failed to save notification preferences.', variant: 'error' });
        } finally {
            setIsSavingPrefs(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast({ title: 'Error', description: 'Please fill all password fields.', variant: 'error' });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({ title: 'Error', description: 'New passwords do not match.', variant: 'error' });
            return;
        }

        setIsChangingPassword(true);
        try {
            await apiClient.post('/api/v1/me/password', { currentPassword, newPassword });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            toast({ title: 'Password changed', description: 'Your password has been updated.', variant: 'success' });
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to change password.',
                variant: 'error',
            });
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-sm text-muted-foreground mt-1">Configure appearance, notifications, and account security.</p>
            </div>

            <Card className="bg-white dark:bg-card border-border/50">
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Select how the portal looks for your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 p-1 bg-muted/40 rounded-lg w-fit">
                        {themeOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setTheme(option.value)}
                                className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${theme === option.value ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {option.icon}
                                {option.label}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</CardTitle>
                    <CardDescription>Choose which personal notifications you receive.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {isLoading ? (
                        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                    ) : (
                        <>
                            <label className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                                <span className="text-sm">Email notifications</span>
                                <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} />
                            </label>
                            <label className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                                <span className="text-sm">In-app push notifications</span>
                                <input type="checkbox" checked={pushNotifications} onChange={(e) => setPushNotifications(e.target.checked)} />
                            </label>
                            <label className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                                <span className="text-sm inline-flex items-center gap-2"><MessageCircle className="h-4 w-4 text-emerald-500" /> WhatsApp notifications</span>
                                <input type="checkbox" checked={whatsappOptIn} onChange={(e) => setWhatsappOptIn(e.target.checked)} />
                            </label>
                        </>
                    )}
                </CardContent>
                <CardFooter className="border-t border-border/50">
                    <Button onClick={handleSaveNotifications} disabled={isSavingPrefs || isLoading} className="gap-2">
                        {isSavingPrefs ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Preferences
                    </Button>
                </CardFooter>
            </Card>

            <Card className="bg-white dark:bg-card border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Lock className="h-4 w-4" /> Security</CardTitle>
                    <CardDescription>Change your account password.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                </CardContent>
                <CardFooter className="border-t border-border/50">
                    <Button onClick={handleChangePassword} disabled={isChangingPassword} className="gap-2">
                        {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                        Update Password
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
