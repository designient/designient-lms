'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageName } from '@/types';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import {
    Save,
    Users,
    Shield,
    Building2,
    CreditCard as BillingIcon,
    Bell,
    Key,
    Webhook,
    Activity,
    Database,
    Check,
    X,
    Upload,
    Palette,
    Layout,
    Plus,
    Trash2,
    Clock,
    Globe,
    Download,
    MessageSquare,
    Tag,
    Loader2,
    GripVertical
} from 'lucide-react';
import {
    AuditLogEntry,
} from '@/types';
import { apiClient } from '@/lib/api-client';

export type SettingsTab =
    | 'organization'
    | 'branding'
    | 'team'
    | 'subscription'
    | 'billing'
    | 'notifications'
    | 'security'
    | 'integrations'
    | 'audit'
    | 'data'
    | 'catalog';

interface SettingsPageProps {
    initialTab?: SettingsTab;
    onBillingClick?: () => void;
    onSelectEntity?: (type: 'student' | 'mentor' | 'cohort', id: string) => void;
}

// Compliance field configuration by country
const complianceFieldsByCountry: Record<string, { key: string; label: string; placeholder: string }[]> = {
    IN: [
        { key: 'gstNumber', label: 'GST Number (GSTIN)', placeholder: '22AAAAA0000A1Z5' },
        { key: 'businessPan', label: 'Business PAN', placeholder: 'AAAAA0000A' },
        { key: 'businessName', label: 'Registered Business Name', placeholder: 'Your registered business name' },
    ],
    US: [
        { key: 'ein', label: 'EIN (Employer Identification Number)', placeholder: 'XX-XXXXXXX' },
        { key: 'stateTaxId', label: 'State Tax ID (optional)', placeholder: 'State tax ID' },
        { key: 'businessName', label: 'Registered Business Name', placeholder: 'Your registered business name' },
    ],
    GB: [
        { key: 'vatNumber', label: 'VAT Number', placeholder: 'GB123456789' },
        { key: 'companyRegNumber', label: 'Company Registration Number', placeholder: '12345678' },
        { key: 'businessName', label: 'Registered Business Name', placeholder: 'Your registered business name' },
    ],
    EU: [
        { key: 'vatNumber', label: 'VAT Number', placeholder: 'EU123456789' },
        { key: 'euCountry', label: 'EU Country', placeholder: 'Select country' },
        { key: 'businessName', label: 'Registered Business Name', placeholder: 'Your registered business name' },
    ],
};

const euCountryOptions = [
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'NL', label: 'Netherlands' },
    { value: 'ES', label: 'Spain' },
    { value: 'IT', label: 'Italy' },
    { value: 'BE', label: 'Belgium' },
    { value: 'AT', label: 'Austria' },
    { value: 'IE', label: 'Ireland' },
    { value: 'PT', label: 'Portugal' },
    { value: 'FI', label: 'Finland' },
];

export default function SettingsPage({
    initialTab = 'organization',
    onBillingClick,
    onSelectEntity
}: SettingsPageProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
    const [isSaving, setIsSaving] = useState(false);
    // Update active tab if initialTab changes
    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    // Data states
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
    const [isAuditLoading, setIsAuditLoading] = useState(false);

    // Organization form state
    const [orgName, setOrgName] = useState('');
    const [orgSlug, setOrgSlug] = useState('');
    const [supportEmail, setSupportEmail] = useState('');
    const [timezone, setTimezone] = useState('Asia/Kolkata');

    // Branding form state
    const [primaryColor, setPrimaryColor] = useState('#059669');

    // Billing form state
    const [billingCountry, setBillingCountry] = useState('IN');
    const [billingFields, setBillingFields] = useState<Record<string, string>>({});

    // Notifications form state
    const [whatsappEnabled, setWhatsappEnabled] = useState(false);
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [smsEnabled, setSmsEnabled] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(true);

    // Subscription real counts
    const [realStudentCount, setRealStudentCount] = useState(0);
    const [realMentorCount, setRealMentorCount] = useState(0);
    const [realCohortCount, setRealCohortCount] = useState(0);
    const [isSubLoading, setIsSubLoading] = useState(false);

    // Settings loading state
    const [isSettingsLoading, setIsSettingsLoading] = useState(true);

    // Catalog states
    const [mentorSpecialties, setMentorSpecialties] = useState<{ value: string; label: string }[]>([]);
    const [isCatalogLoading, setIsCatalogLoading] = useState(false);
    const [isCatalogSaving, setIsCatalogSaving] = useState(false);
    const [newSpecialtyLabel, setNewSpecialtyLabel] = useState('');

    // Fetch all settings on mount
    useEffect(() => {
        async function fetchSettings() {
            try {
                setIsSettingsLoading(true);
                setIsCatalogLoading(true);
                const settings = await apiClient.get<{
                    orgName?: string;
                    orgSlug?: string;
                    supportEmail?: string;
                    primaryColor?: string;
                    billingSettings?: Record<string, string>;
                    securitySettings?: Record<string, boolean>;
                    catalogSettings?: {
                        mentorSpecialties?: { value: string; label: string }[];
                    };
                }>('/api/v1/settings');

                // Organization
                if (settings.orgName) setOrgName(settings.orgName);
                if (settings.orgSlug) setOrgSlug(settings.orgSlug);
                if (settings.supportEmail) setSupportEmail(settings.supportEmail);
                if (settings.billingSettings?.timezone) setTimezone(settings.billingSettings.timezone);

                // Branding
                if (settings.primaryColor) setPrimaryColor(settings.primaryColor);

                // Billing
                if (settings.billingSettings) {
                    const bs = settings.billingSettings;
                    if (bs.country) setBillingCountry(bs.country);
                    const fields: Record<string, string> = {};
                    Object.keys(bs).forEach(k => {
                        if (k !== 'country' && k !== 'timezone') fields[k] = bs[k];
                    });
                    setBillingFields(fields);
                }

                // Notifications
                if (settings.securitySettings) {
                    const ss = settings.securitySettings;
                    if (ss.whatsappEnabled !== undefined) setWhatsappEnabled(!!ss.whatsappEnabled);
                    if (ss.emailEnabled !== undefined) setEmailEnabled(!!ss.emailEnabled);
                    if (ss.smsEnabled !== undefined) setSmsEnabled(!!ss.smsEnabled);
                    if (ss.pushEnabled !== undefined) setPushEnabled(!!ss.pushEnabled);
                }

                // Catalog
                const specialties = settings.catalogSettings?.mentorSpecialties || [];
                setMentorSpecialties(specialties);
            } catch {
                // Settings may not exist yet; start with defaults
            } finally {
                setIsSettingsLoading(false);
                setIsCatalogLoading(false);
            }
        }
        fetchSettings();
    }, []);

    // Fetch audit logs when audit tab is active
    useEffect(() => {
        if (activeTab === 'audit' && auditLogs.length === 0) {
            setIsAuditLoading(true);
            apiClient.get<{ logs: AuditLogEntry[] }>('/api/v1/audit-logs?limit=20')
                .then(res => {
                    setAuditLogs(res.logs);
                })
                .catch(() => {
                    setAuditLogs([]);
                })
                .finally(() => setIsAuditLoading(false));
        }
    }, [activeTab, auditLogs.length]);

    // Fetch real subscription counts when subscription tab is active
    useEffect(() => {
        if (activeTab === 'subscription' && !isSubLoading && realStudentCount === 0) {
            setIsSubLoading(true);
            Promise.all([
                apiClient.get<{ pagination: { total: number } }>('/api/v1/students?limit=1'),
                apiClient.get<{ pagination: { total: number } }>('/api/v1/mentors?limit=1'),
                apiClient.get<{ pagination: { total: number } }>('/api/v1/cohorts?limit=1'),
            ]).then(([students, mentors, cohorts]) => {
                setRealStudentCount(students.pagination?.total || 0);
                setRealMentorCount(mentors.pagination?.total || 0);
                setRealCohortCount(cohorts.pagination?.total || 0);
            }).catch(() => {
                // Ignore -- counts stay 0
            }).finally(() => setIsSubLoading(false));
        }
    }, [activeTab, isSubLoading, realStudentCount]);

    const handleAddSpecialty = () => {
        const label = newSpecialtyLabel.trim();
        if (!label) return;
        const value = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (mentorSpecialties.some((s) => s.value === value)) {
            toast({ title: 'Duplicate', description: 'This specialty already exists.', variant: 'error' });
            return;
        }
        setMentorSpecialties((prev) => [...prev, { value, label }]);
        setNewSpecialtyLabel('');
    };

    const handleRemoveSpecialty = (value: string) => {
        setMentorSpecialties((prev) => prev.filter((s) => s.value !== value));
    };

    const handleUpdateSpecialtyLabel = (value: string, newLabel: string) => {
        setMentorSpecialties((prev) =>
            prev.map((s) => (s.value === value ? { ...s, label: newLabel } : s))
        );
    };

    const handleSaveCatalog = async () => {
        setIsCatalogSaving(true);
        try {
            await apiClient.put('/api/v1/settings', {
                catalogSettings: {
                    mentorSpecialties: mentorSpecialties,
                },
            });
            toast({
                title: 'Catalog Saved',
                description: 'Mentor specialties have been updated.',
                variant: 'success',
            });
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to save catalog settings.',
                variant: 'error',
            });
        } finally {
            setIsCatalogSaving(false);
        }
    };

    const handleNavigate = (page: PageName) => {
        router.push(`/${page}`);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let payload: Record<string, unknown> = {};
            if (activeTab === 'organization') {
                payload = { orgName, orgSlug, supportEmail: supportEmail || null };
                // Store timezone in billingSettings to persist it
                const currentBilling = { ...billingFields, country: billingCountry, timezone };
                payload.billingSettings = currentBilling;
            } else if (activeTab === 'branding') {
                payload = { primaryColor };
            } else if (activeTab === 'billing') {
                payload = {
                    billingSettings: { ...billingFields, country: billingCountry, timezone },
                };
            } else if (activeTab === 'notifications') {
                payload = {
                    securitySettings: { whatsappEnabled, emailEnabled, smsEnabled, pushEnabled },
                };
            }
            await apiClient.put('/api/v1/settings', payload);
            toast({
                title: 'Settings Saved',
                description: 'Your changes have been saved successfully.',
                variant: 'success',
            });
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to save settings. Please try again.',
                variant: 'error',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleBillingFieldChange = (key: string, value: string) => {
        setBillingFields(prev => ({ ...prev, [key]: value }));
    };

    const tabs: {
        id: SettingsTab;
        label: string;
        icon: any;
    }[] = [
            {
                id: 'organization',
                label: 'Organization',
                icon: Building2
            },
            {
                id: 'branding',
                label: 'Branding',
                icon: Palette
            },
            {
                id: 'team',
                label: 'Team & Roles',
                icon: Users
            },
            {
                id: 'subscription',
                label: 'Subscription',
                icon: Layout
            },
            {
                id: 'billing',
                label: 'Billing',
                icon: BillingIcon
            },
            {
                id: 'notifications',
                label: 'Notifications',
                icon: Bell
            },
            {
                id: 'security',
                label: 'Security',
                icon: Shield
            },
            {
                id: 'integrations',
                label: 'Integrations',
                icon: Webhook
            },
            {
                id: 'audit',
                label: 'Audit Log',
                icon: Activity
            },
            {
                id: 'data',
                label: 'Data',
                icon: Database
            },
            {
                id: 'catalog',
                label: 'Catalog',
                icon: Tag
            }
        ];

    return (
        <DashboardLayout
            title="Settings"
            subtitle="Configure platform settings and preferences"
            currentPage="settings"
            onNavigate={handleNavigate}
            onBillingClick={onBillingClick}
            onSelectEntity={onSelectEntity}
        >
            <div className="space-y-6">
                {/* Tabs Navigation */}
                <div className="border-b border-border/50 overflow-x-auto">
                    <nav className="flex space-x-1" aria-label="Tabs">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`group inline-flex items-center py-3 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${isActive
                                            ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50 dark:bg-emerald-500/10 dark:text-emerald-400'
                                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                                        }`}
                                >
                                    <tab.icon
                                        className={`-ml-0.5 mr-1.5 h-4 w-4 ${isActive
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-muted-foreground group-hover:text-foreground'
                                            }`}
                                    />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="max-w-4xl">
                    {/* Organization Tab */}
                    {activeTab === 'organization' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Organization Details
                                            </CardTitle>
                                            <CardDescription>
                                                Basic information about your institute.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    {isSettingsLoading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="orgName">Organization Name</Label>
                                                    <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="orgSlug">Organization Slug</Label>
                                                    <div className="flex rounded-md shadow-sm">
                                                        <Input
                                                            id="orgSlug"
                                                            value={orgSlug}
                                                            onChange={(e) => setOrgSlug(e.target.value)}
                                                            className="rounded-r-none"
                                                        />
                                                        <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-border bg-muted text-muted-foreground text-sm">
                                                            .designient.com
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="supportEmail">Support Email</Label>
                                                    <Input
                                                        id="supportEmail"
                                                        type="email"
                                                        value={supportEmail}
                                                        onChange={(e) => setSupportEmail(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="timezone">Timezone</Label>
                                                    <Select
                                                        id="timezone"
                                                        options={[
                                                            { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
                                                            { value: 'America/New_York', label: 'Eastern Time (ET)' },
                                                            { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
                                                            { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
                                                            { value: 'Europe/Berlin', label: 'Central European Time (CET)' },
                                                        ]}
                                                        value={timezone}
                                                        onChange={(e) => setTimezone(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                                <CardFooter className="bg-muted/20 border-t border-border/50 flex justify-end py-3">
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving || isSettingsLoading}
                                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <Save className="h-4 w-4" />
                                        {isSaving ? 'Saving...' : 'Save Organization'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    )}

                    {/* Branding Tab */}
                    {activeTab === 'branding' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Palette className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Branding & Appearance
                                            </CardTitle>
                                            <CardDescription>
                                                Customize how your platform looks to students and
                                                mentors.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-4">
                                    <div className="space-y-3">
                                        <Label>Organization Logo</Label>
                                        <div className="flex items-start gap-4">
                                            <div className="h-24 w-24 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                                                <span className="text-2xl font-bold text-primary">
                                                    D
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" className="gap-2">
                                                        <Upload className="h-3.5 w-3.5" />
                                                        Upload Logo
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    PNG, JPG up to 2MB. Recommended: 128x128px.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label>Primary Brand Color</Label>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-md shadow-sm ring-2 ring-offset-2 ring-offset-background ring-emerald-600/50" style={{ backgroundColor: primaryColor }}></div>
                                            <Input
                                                className="w-32 font-mono"
                                                value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                            />
                                            <input
                                                type="color"
                                                value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                className="h-8 w-8 rounded cursor-pointer border-0"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-muted/20 border-t border-border/50 flex justify-end py-3">
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving || isSettingsLoading}
                                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <Save className="h-4 w-4" />
                                        {isSaving ? 'Saving...' : 'Save Branding'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    )}

                    {/* Team Tab */}
                    {activeTab === 'team' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                                        <Users className="h-7 w-7 text-emerald-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-1">Team Management</h3>
                                    <p className="text-sm text-muted-foreground text-center max-w-md">
                                        Invite team members, assign roles, and manage permissions. This feature is coming soon.
                                    </p>
                                    <Badge variant="outline" className="mt-4 text-xs">Coming Soon</Badge>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Subscription Tab */}
                    {activeTab === 'subscription' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Layout className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Current Plan
                                            </CardTitle>
                                            <CardDescription>
                                                Manage your subscription and usage.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-4">
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base font-semibold tracking-tight text-emerald-700">
                                                    GROWTH PLAN
                                                </h3>
                                                <Badge variant="success" className="text-[10px]">
                                                    Active
                                                </Badge>
                                            </div>
                                            <span className="font-semibold text-foreground">
                                                ₹24,999/month
                                            </span>
                                        </div>
                                        <div className="h-px bg-emerald-200 w-full my-3"></div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Plan management coming soon
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-medium">Current Usage</h4>
                                        {isSubLoading ? (
                                            <div className="flex justify-center py-4">
                                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-muted-foreground">Students</span>
                                                        <span className="font-medium">{realStudentCount} / 500</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((realStudentCount / 500) * 100, 100)}%` }}></div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-muted-foreground">Mentors</span>
                                                        <span className="font-medium">{realMentorCount} / 20</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((realMentorCount / 20) * 100, 100)}%` }}></div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-muted-foreground">Active Cohorts</span>
                                                        <span className="font-medium">{realCohortCount} / 25</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((realCohortCount / 25) * 100, 100)}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Billing Tab */}
                    {activeTab === 'billing' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Billing & Compliance
                                            </CardTitle>
                                            <CardDescription>
                                                Configure tax compliance and business details for invoicing.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    {isSettingsLoading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="billingCountry">Country / Region</Label>
                                                <Select
                                                    id="billingCountry"
                                                    options={[
                                                        { value: 'IN', label: 'India' },
                                                        { value: 'US', label: 'United States' },
                                                        { value: 'GB', label: 'United Kingdom' },
                                                        { value: 'EU', label: 'European Union' },
                                                    ]}
                                                    value={billingCountry}
                                                    onChange={(e) => {
                                                        setBillingCountry(e.target.value);
                                                        setBillingFields({});
                                                    }}
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {(complianceFieldsByCountry[billingCountry] || []).map((field) => (
                                                    <div key={field.key} className="space-y-1.5">
                                                        <Label htmlFor={field.key}>{field.label}</Label>
                                                        {field.key === 'euCountry' ? (
                                                            <Select
                                                                id={field.key}
                                                                options={euCountryOptions}
                                                                value={billingFields[field.key] || ''}
                                                                onChange={(e) => handleBillingFieldChange(field.key, e.target.value)}
                                                            />
                                                        ) : (
                                                            <Input
                                                                id={field.key}
                                                                placeholder={field.placeholder}
                                                                value={billingFields[field.key] || ''}
                                                                onChange={(e) => handleBillingFieldChange(field.key, e.target.value)}
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                                <CardFooter className="bg-muted/20 border-t border-border/50 flex justify-end py-3">
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving || isSettingsLoading}
                                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <Save className="h-4 w-4" />
                                        {isSaving ? 'Saving...' : 'Save Billing Info'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Communication Channels
                                            </CardTitle>
                                            <CardDescription>
                                                Configure how you communicate with students and mentors.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    {isSettingsLoading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/20 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    id="whatsappNotif"
                                                    className="mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                    checked={whatsappEnabled}
                                                    onChange={(e) => setWhatsappEnabled(e.target.checked)}
                                                />
                                                <div>
                                                    <label htmlFor="whatsappNotif" className="text-sm font-medium text-foreground block">
                                                        WhatsApp Notifications
                                                    </label>
                                                    <p className="text-xs text-muted-foreground">
                                                        Send updates via WhatsApp (requires student opt-in).
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/20 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    id="emailNotif"
                                                    className="mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                    checked={emailEnabled}
                                                    onChange={(e) => setEmailEnabled(e.target.checked)}
                                                />
                                                <div>
                                                    <label htmlFor="emailNotif" className="text-sm font-medium text-foreground block">
                                                        Email Notifications
                                                    </label>
                                                    <p className="text-xs text-muted-foreground">
                                                        Primary channel for detailed communications.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/20 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    id="smsNotif"
                                                    className="mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                    checked={smsEnabled}
                                                    onChange={(e) => setSmsEnabled(e.target.checked)}
                                                />
                                                <div>
                                                    <label htmlFor="smsNotif" className="text-sm font-medium text-foreground block">
                                                        SMS Notifications
                                                    </label>
                                                    <p className="text-xs text-muted-foreground">
                                                        Send critical alerts via SMS.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/20 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    id="pushNotif"
                                                    className="mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                    checked={pushEnabled}
                                                    onChange={(e) => setPushEnabled(e.target.checked)}
                                                />
                                                <div>
                                                    <label htmlFor="pushNotif" className="text-sm font-medium text-foreground block">
                                                        Push Notifications
                                                    </label>
                                                    <p className="text-xs text-muted-foreground">
                                                        In-app push notifications for real-time updates.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="bg-muted/20 border-t border-border/50 flex justify-end py-3">
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving || isSettingsLoading}
                                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <Save className="h-4 w-4" />
                                        {isSaving ? 'Saving...' : 'Save Preferences'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                                        <Shield className="h-7 w-7 text-emerald-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-1">Security Settings</h3>
                                    <p className="text-sm text-muted-foreground text-center max-w-md">
                                        Two-factor authentication, session management, and login policies. This feature is coming soon.
                                    </p>
                                    <Badge variant="outline" className="mt-4 text-xs">Coming Soon</Badge>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Integrations Tab */}
                    {activeTab === 'integrations' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                                        <Key className="h-7 w-7 text-emerald-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-1">Integrations & API</h3>
                                    <p className="text-sm text-muted-foreground text-center max-w-md">
                                        API keys, webhooks, and third-party integrations. This feature is coming soon.
                                    </p>
                                    <Badge variant="outline" className="mt-4 text-xs">Coming Soon</Badge>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Audit Log Tab */}
                    {activeTab === 'audit' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Activity Log
                                                </CardTitle>
                                                <CardDescription>
                                                    Track all actions performed in the dashboard.
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" className="gap-1.5">
                                            <Download className="h-3.5 w-3.5" />
                                            Export Log
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-border/50">
                                        {isAuditLoading ? (
                                            <div className="flex justify-center py-8">
                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                            </div>
                                        ) : auditLogs.length === 0 ? (
                                            <div className="text-center py-8 text-sm text-muted-foreground">
                                                No audit log entries yet.
                                            </div>
                                        ) : null}
                                        {auditLogs.map((log) => (
                                            <div
                                                key={log.id}
                                                className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors"
                                            >
                                                <div
                                                    className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${log.status === 'success'
                                                            ? 'bg-emerald-100'
                                                            : 'bg-red-100'
                                                        }`}
                                                >
                                                    {log.status === 'success' ? (
                                                        <Check className="h-4 w-4 text-emerald-600" />
                                                    ) : (
                                                        <X className="h-4 w-4 text-red-600" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm font-medium">
                                                            {log.userName}
                                                        </span>
                                                        <Badge variant="outline" className="text-[9px]">
                                                            {log.userRole
                                                                .split('_')
                                                                .map(
                                                                    (w) => w.charAt(0).toUpperCase() + w.slice(1)
                                                                )
                                                                .join(' ')}
                                                        </Badge>
                                                        <span className="text-sm text-muted-foreground">
                                                            performed
                                                        </span>
                                                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                                                            {log.action}
                                                        </code>
                                                    </div>
                                                    {log.details && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {log.details}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {new Date(log.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Globe className="h-3 w-3" />
                                                            {log.ipAddress}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-muted/20 border-t border-border/50 flex justify-center py-3">
                                    <Button variant="ghost" size="sm">
                                        Load More
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    )}

                    {/* Data Tab */}
                    {activeTab === 'data' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                                        <Database className="h-7 w-7 text-emerald-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-1">Data Management</h3>
                                    <p className="text-sm text-muted-foreground text-center max-w-md">
                                        Export data, manage backups, and configure retention policies. This feature is coming soon.
                                    </p>
                                    <Badge variant="outline" className="mt-4 text-xs">Coming Soon</Badge>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Catalog Tab */}
                    {activeTab === 'catalog' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Tag className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Mentor Specialties
                                            </CardTitle>
                                            <CardDescription>
                                                Configure the list of specialties available when adding or editing mentors.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    {isCatalogLoading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : (
                                        <>
                                            {mentorSpecialties.length === 0 && (
                                                <p className="text-sm text-muted-foreground py-4 text-center">
                                                    No specialties configured yet. Add one below.
                                                </p>
                                            )}
                                            <div className="space-y-2">
                                                {mentorSpecialties.map((specialty) => (
                                                    <div
                                                        key={specialty.value}
                                                        className="flex items-center gap-3 group"
                                                    >
                                                        <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                                                        <Input
                                                            value={specialty.label}
                                                            onChange={(e) =>
                                                                handleUpdateSpecialtyLabel(specialty.value, e.target.value)
                                                            }
                                                            className="flex-1"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveSpecialty(specialty.value)}
                                                            className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Remove specialty"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                                                <Input
                                                    placeholder="e.g., Data Science"
                                                    value={newSpecialtyLabel}
                                                    onChange={(e) => setNewSpecialtyLabel(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddSpecialty();
                                                        }
                                                    }}
                                                    className="flex-1"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={handleAddSpecialty}
                                                    disabled={!newSpecialtyLabel.trim()}
                                                    className="gap-1.5 flex-shrink-0"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Add
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                                <CardFooter className="bg-muted/20 border-t border-border/50 flex justify-between items-center py-3">
                                    <p className="text-xs text-muted-foreground">
                                        {mentorSpecialties.length} {mentorSpecialties.length === 1 ? 'specialty' : 'specialties'} configured
                                    </p>
                                    <Button
                                        onClick={handleSaveCatalog}
                                        disabled={isCatalogSaving || isCatalogLoading}
                                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <Save className="h-4 w-4" />
                                        {isCatalogSaving ? 'Saving...' : 'Save Specialties'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    )}
                </div>

            </div>
        </DashboardLayout>
    );
}
