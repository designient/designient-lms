'use client';

import React, { useEffect, useRef, useState } from 'react';
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
    GripVertical,
    Mail,
    UserPlus,
    Copy,
    FileSpreadsheet,
    Video,
    Phone,
    Link2,
    Eye,
    EyeOff,
    BarChart3,
    UserX,
    UserCheck2
} from 'lucide-react';
import {
    AuditLogEntry,
} from '@/types';
import { apiClient } from '@/lib/api-client';
import { PLAN_CATALOG, formatPrice, type CurrencyKey } from '@/lib/plan-catalog';

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

type TeamMemberSettings = {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
    createdAt: string;
    status: 'INVITED' | 'ACTIVE' | 'DEACTIVATED';
    isActive: boolean;
};

// Helper to convert hex color to HSL string for CSS variables
function hexToHsl(hex: string): string | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
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
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [isLogoUploading, setIsLogoUploading] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);

    // Billing form state
    const [billingCountry, setBillingCountry] = useState('IN');
    const [billingFields, setBillingFields] = useState<Record<string, string>>({});

    // Notifications form state
    const [whatsappEnabled, setWhatsappEnabled] = useState(false);
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [smsEnabled, setSmsEnabled] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(true);

    // Subscription state
    const [subscription, setSubscription] = useState<import('@/types').Subscription | null>(null);
    const [isSubLoading, setIsSubLoading] = useState(false);
    const [subBillingToggle, setSubBillingToggle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
    const [isSubSaving, setIsSubSaving] = useState(false);

    // Settings loading state
    const [isSettingsLoading, setIsSettingsLoading] = useState(true);

    // Catalog states
    const [mentorSpecialties, setMentorSpecialties] = useState<{ value: string; label: string }[]>([]);
    const [isCatalogLoading, setIsCatalogLoading] = useState(false);
    const [isCatalogSaving, setIsCatalogSaving] = useState(false);
    const [newSpecialtyLabel, setNewSpecialtyLabel] = useState('');

    // Team states
    const [teamMembers, setTeamMembers] = useState<TeamMemberSettings[]>([]);
    const [isTeamLoading, setIsTeamLoading] = useState(false);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteName, setInviteName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('INSTRUCTOR');
    const [isInviting, setIsInviting] = useState(false);
    const [teamActionLoading, setTeamActionLoading] = useState<Record<string, boolean>>({});

    // Security settings states
    const [minPasswordLength, setMinPasswordLength] = useState(8);
    const [requireUppercase, setRequireUppercase] = useState(true);
    const [requireNumbers, setRequireNumbers] = useState(true);
    const [requireSpecialChars, setRequireSpecialChars] = useState(false);
    const [sessionTimeout, setSessionTimeout] = useState('4h');
    const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);

    // Integration states
    const [zoomEnabled, setZoomEnabled] = useState(false);
    const [zoomApiKey, setZoomApiKey] = useState('');
    const [zoomApiSecret, setZoomApiSecret] = useState('');
    const [meetEnabled, setMeetEnabled] = useState(false);
    const [meetClientId, setMeetClientId] = useState('');
    const [whatsappBizEnabled, setWhatsappBizEnabled] = useState(false);
    const [whatsappBizPhone, setWhatsappBizPhone] = useState('');
    const [whatsappBizToken, setWhatsappBizToken] = useState('');
    const [webhookUrl, setWebhookUrl] = useState('');
    const [webhookEnabled, setWebhookEnabled] = useState(false);
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

    // Data management states
    const [isExporting, setIsExporting] = useState<string | null>(null);
    const [dataCounts, setDataCounts] = useState<{ students: number; mentors: number; cohorts: number; courses: number; messages: number }>({ students: 0, mentors: 0, cohorts: 0, courses: 0, messages: 0 });

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
                    logoUrl?: string | null;
                    billingSettings?: Record<string, string>;
                    securitySettings?: Record<string, unknown>;
                    integrationSettings?: Record<string, unknown>;
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
                if (settings.logoUrl) setLogoUrl(settings.logoUrl);

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

                // Notifications channel prefs
                if (settings.securitySettings) {
                    const ss = settings.securitySettings as Record<string, unknown>;
                    if (ss.whatsappEnabled !== undefined) setWhatsappEnabled(!!ss.whatsappEnabled);
                    if (ss.emailEnabled !== undefined) setEmailEnabled(!!ss.emailEnabled);
                    if (ss.smsEnabled !== undefined) setSmsEnabled(!!ss.smsEnabled);
                    if (ss.pushEnabled !== undefined) setPushEnabled(!!ss.pushEnabled);
                    // Security policy
                    if (ss.minPasswordLength !== undefined) setMinPasswordLength(ss.minPasswordLength as number);
                    if (ss.requireUppercase !== undefined) setRequireUppercase(!!ss.requireUppercase);
                    if (ss.requireNumbers !== undefined) setRequireNumbers(!!ss.requireNumbers);
                    if (ss.requireSpecialChars !== undefined) setRequireSpecialChars(!!ss.requireSpecialChars);
                    if (ss.sessionTimeout !== undefined) setSessionTimeout(ss.sessionTimeout as string);
                    if (ss.maxLoginAttempts !== undefined) setMaxLoginAttempts(ss.maxLoginAttempts as number);
                }

                // Integration settings
                if (settings.integrationSettings) {
                    const is_ = settings.integrationSettings as Record<string, unknown>;
                    if (is_.zoomEnabled !== undefined) setZoomEnabled(!!is_.zoomEnabled);
                    if (is_.zoomApiKey) setZoomApiKey(is_.zoomApiKey as string);
                    if (is_.zoomApiSecret) setZoomApiSecret(is_.zoomApiSecret as string);
                    if (is_.meetEnabled !== undefined) setMeetEnabled(!!is_.meetEnabled);
                    if (is_.meetClientId) setMeetClientId(is_.meetClientId as string);
                    if (is_.whatsappBizEnabled !== undefined) setWhatsappBizEnabled(!!is_.whatsappBizEnabled);
                    if (is_.whatsappBizPhone) setWhatsappBizPhone(is_.whatsappBizPhone as string);
                    if (is_.whatsappBizToken) setWhatsappBizToken(is_.whatsappBizToken as string);
                    if (is_.webhookUrl) setWebhookUrl(is_.webhookUrl as string);
                    if (is_.webhookEnabled !== undefined) setWebhookEnabled(!!is_.webhookEnabled);
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

    // Fetch subscription when subscription tab is active
    useEffect(() => {
        if (activeTab === 'subscription' && !subscription && !isSubLoading) {
            setIsSubLoading(true);
            apiClient.get<import('@/types').Subscription>('/api/v1/subscription')
                .then(data => {
                    setSubscription(data);
                    setSubBillingToggle(data.billingCycle);
                })
                .catch(() => {
                    // Subscription may not exist yet
                })
                .finally(() => setIsSubLoading(false));
        }
    }, [activeTab, subscription, isSubLoading]);

    // Fetch team members when team tab is active
    const refreshTeamMembers = async () => {
        setIsTeamLoading(true);
        try {
            const res = await apiClient.get<{ team: TeamMemberSettings[] }>('/api/v1/settings/team');
            setTeamMembers(res.team);
        } catch {
            setTeamMembers([]);
        } finally {
            setIsTeamLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'team' && teamMembers.length === 0) {
            refreshTeamMembers();
        }
    }, [activeTab, teamMembers.length]);

    // Fetch data counts when data tab is active
    useEffect(() => {
        if (activeTab === 'data' && dataCounts.students === 0) {
            apiClient.get<{
                totalStudents?: number;
                totalMentors?: number;
                totalCohorts?: number;
                totalCourses?: number;
                students?: { total?: number };
                mentors?: { total?: number };
                cohorts?: { total?: number };
            }>('/api/v1/admin/dashboard/summary')
                .then(res => setDataCounts({
                    students: res.students?.total ?? res.totalStudents ?? 0,
                    mentors: res.mentors?.total ?? res.totalMentors ?? 0,
                    cohorts: res.cohorts?.total ?? res.totalCohorts ?? 0,
                    courses: res.totalCourses || 0,
                    messages: 0,
                }))
                .catch(() => { });
        }
    }, [activeTab, dataCounts.students]);

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
                    securitySettings: { whatsappEnabled, emailEnabled, smsEnabled, pushEnabled, minPasswordLength, requireUppercase, requireNumbers, requireSpecialChars, sessionTimeout, maxLoginAttempts },
                };
            } else if (activeTab === 'security') {
                payload = {
                    securitySettings: { whatsappEnabled, emailEnabled, smsEnabled, pushEnabled, minPasswordLength, requireUppercase, requireNumbers, requireSpecialChars, sessionTimeout, maxLoginAttempts },
                };
            } else if (activeTab === 'integrations') {
                payload = {
                    integrationSettings: { zoomEnabled, zoomApiKey, zoomApiSecret, meetEnabled, meetClientId, whatsappBizEnabled, whatsappBizPhone, whatsappBizToken, webhookUrl, webhookEnabled },
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

    // Team invite handler
    const handleInviteTeamMember = async () => {
        if (!inviteName.trim() || !inviteEmail.trim()) {
            toast({ title: 'Missing Fields', description: 'Name and email are required.', variant: 'error' });
            return;
        }
        setIsInviting(true);
        try {
            const newMember = await apiClient.post<TeamMemberSettings>('/api/v1/settings/team', {
                name: inviteName.trim(),
                email: inviteEmail.trim(),
                role: inviteRole,
            });
            setTeamMembers(prev => [...prev, newMember]);
            setShowInviteForm(false);
            setInviteName('');
            setInviteEmail('');
            setInviteRole('INSTRUCTOR');
            toast({ title: 'Member Invited', description: `${newMember.name} has been added to the team.`, variant: 'success' });
        } catch {
            toast({ title: 'Error', description: 'Failed to invite team member. They may already exist.', variant: 'error' });
        } finally {
            setIsInviting(false);
        }
    };

    const withTeamMemberLoading = async (memberId: string, action: () => Promise<void>) => {
        setTeamActionLoading((prev) => ({ ...prev, [memberId]: true }));
        try {
            await action();
        } finally {
            setTeamActionLoading((prev) => ({ ...prev, [memberId]: false }));
        }
    };

    const handleResendInvite = async (member: TeamMemberSettings) => {
        await withTeamMemberLoading(member.id, async () => {
            try {
                await apiClient.post(`/api/v1/settings/team/${member.id}/resend-invite`, {});
                toast({ title: 'Invite Resent', description: `Invitation resent to ${member.email}.`, variant: 'success' });
            } catch {
                toast({ title: 'Error', description: 'Failed to resend invitation.', variant: 'error' });
            }
        });
    };

    const handleToggleTeamMember = async (member: TeamMemberSettings) => {
        await withTeamMemberLoading(member.id, async () => {
            try {
                const updated = await apiClient.patch<TeamMemberSettings>(`/api/v1/settings/team/${member.id}/status`, {
                    isActive: !member.isActive,
                });
                setTeamMembers((prev) => prev.map((m) => (m.id === member.id ? updated : m)));
                toast({
                    title: updated.isActive ? 'Member Activated' : 'Member Deactivated',
                    description: `${updated.name} is now ${updated.isActive ? 'active' : 'deactivated'}.`,
                    variant: 'success',
                });
            } catch {
                toast({ title: 'Error', description: 'Failed to update team member status.', variant: 'error' });
            }
        });
    };

    // CSV Export handler
    const handleExportCSV = async (entity: string) => {
        setIsExporting(entity);
        try {
            let data: Record<string, unknown>[] = [];
            let filename = `${entity}.csv`;
            if (entity === 'students') {
                const res = await apiClient.get<{ students?: Record<string, unknown>[] } | Record<string, unknown>[]>('/api/v1/students');
                data = Array.isArray(res) ? res : (res.students || []);
            } else if (entity === 'mentors') {
                const res = await apiClient.get<{ mentors?: Record<string, unknown>[] } | Record<string, unknown>[]>('/api/v1/mentors');
                data = Array.isArray(res) ? res : (res.mentors || []);
            } else if (entity === 'cohorts') {
                const res = await apiClient.get<{ cohorts?: Record<string, unknown>[] } | Record<string, unknown>[]>('/api/v1/cohorts');
                data = Array.isArray(res) ? res : (res.cohorts || []);
            }
            if (data.length === 0) {
                toast({ title: 'No Data', description: `No ${entity} data to export.`, variant: 'info' });
                return;
            }
            // Convert to CSV
            const headers = Object.keys(data[0]);
            const csvRows = [headers.join(',')];
            for (const row of data) {
                csvRows.push(headers.map(h => {
                    const val = row[h];
                    const str = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
                    return `"${str.replace(/"/g, '""')}"`;
                }).join(','));
            }
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
            toast({ title: 'Export Complete', description: `${entity} data exported successfully.`, variant: 'success' });
        } catch {
            toast({ title: 'Export Failed', description: `Could not export ${entity} data.`, variant: 'error' });
        } finally {
            setIsExporting(null);
        }
    };

    const handleBrandingSave = async () => {
        setIsSaving(true);
        try {
            await apiClient.put('/api/v1/settings', { primaryColor });
            // Apply the color to CSS variables immediately so the whole app updates
            const hsl = hexToHsl(primaryColor);
            if (hsl) {
                document.documentElement.style.setProperty('--primary', hsl);
                document.documentElement.style.setProperty('--ring', hsl);
            }
            toast({
                title: 'Branding Saved',
                description: 'Your brand color has been updated across the platform.',
                variant: 'success',
            });
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to save branding. Please try again.',
                variant: 'error',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            toast({ title: 'Invalid file', description: 'Please upload a PNG, JPG, WebP, or SVG file.', variant: 'error' });
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast({ title: 'File too large', description: 'Maximum file size is 2MB.', variant: 'error' });
            return;
        }

        setIsLogoUploading(true);
        try {
            const formData = new FormData();
            formData.append('logo', file);

            const res = await fetch('/api/v1/settings/logo', { method: 'POST', body: formData });
            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.error?.message || 'Upload failed');
            }
            const json = await res.json();
            const newUrl = json.data?.logoUrl;
            if (newUrl) {
                setLogoUrl(newUrl);
                // Update the CSS variable for the sidebar logo
                document.documentElement.style.setProperty('--brand-logo-url', `url(${newUrl})`);
            }
            toast({ title: 'Logo Uploaded', description: 'Your organization logo has been updated.', variant: 'success' });
        } catch (err) {
            toast({ title: 'Upload Failed', description: err instanceof Error ? err.message : 'Could not upload logo.', variant: 'error' });
        } finally {
            setIsLogoUploading(false);
            if (logoInputRef.current) logoInputRef.current.value = '';
        }
    };

    const handleLogoRemove = async () => {
        setIsLogoUploading(true);
        try {
            const res = await fetch('/api/v1/settings/logo', { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to remove logo');
            setLogoUrl(null);
            document.documentElement.style.removeProperty('--brand-logo-url');
            toast({ title: 'Logo Removed', description: 'Organization logo has been removed.', variant: 'success' });
        } catch {
            toast({ title: 'Error', description: 'Could not remove logo.', variant: 'error' });
        } finally {
            setIsLogoUploading(false);
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
                                                Customize how your platform looks to students and mentors.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-4">
                                    {isSettingsLoading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : (
                                        <>
                                            {/* Logo Section */}
                                            <div className="space-y-3">
                                                <Label>Organization Logo</Label>
                                                <div className="flex items-start gap-4">
                                                    <div className="h-24 w-24 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden relative">
                                                        {isLogoUploading && (
                                                            <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10">
                                                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        {logoUrl ? (
                                                            <img
                                                                src={logoUrl}
                                                                alt="Organization logo"
                                                                className="h-full w-full object-contain"
                                                            />
                                                        ) : (
                                                            <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                                                                {orgName ? orgName.charAt(0).toUpperCase() : 'D'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <input
                                                            ref={logoInputRef}
                                                            type="file"
                                                            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                                                            onChange={handleLogoUpload}
                                                            className="hidden"
                                                        />
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="gap-2"
                                                                onClick={() => logoInputRef.current?.click()}
                                                                disabled={isLogoUploading}
                                                            >
                                                                <Upload className="h-3.5 w-3.5" />
                                                                {logoUrl ? 'Change Logo' : 'Upload Logo'}
                                                            </Button>
                                                            {logoUrl && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-destructive hover:text-destructive"
                                                                    onClick={handleLogoRemove}
                                                                    disabled={isLogoUploading}
                                                                >
                                                                    Remove
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            PNG, JPG, WebP, or SVG up to 2MB. Recommended: 128×128px.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Primary Color */}
                                            <div className="space-y-3">
                                                <Label>Primary Brand Color</Label>
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="h-10 w-10 rounded-md shadow-sm outline outline-2 outline-offset-2"
                                                        style={{ backgroundColor: primaryColor, outlineColor: primaryColor }}
                                                    ></div>
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
                                                <p className="text-xs text-muted-foreground">
                                                    This color is applied across the sidebar, navigation highlights, and accent elements.
                                                </p>
                                            </div>

                                            {/* Live Preview */}
                                            <div className="space-y-3 pt-2 border-t border-border/50">
                                                <Label>Live Preview</Label>
                                                <div className="rounded-lg border border-border/50 p-4 space-y-3 bg-muted/10">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg flex items-center justify-center overflow-hidden" style={{ backgroundColor: logoUrl ? 'transparent' : primaryColor + '1a' }}>
                                                            {logoUrl ? (
                                                                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                                                            ) : (
                                                                <span className="text-xs font-bold" style={{ color: primaryColor }}>
                                                                    {orgName ? orgName.charAt(0).toUpperCase() : 'D'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-sm font-semibold">{orgName || 'Designient'}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <div className="px-3 py-1.5 rounded-md text-xs font-medium text-white" style={{ backgroundColor: primaryColor }}>
                                                            Active Button
                                                        </div>
                                                        <div className="px-3 py-1.5 rounded-md text-xs font-medium border" style={{ borderColor: primaryColor, color: primaryColor }}>
                                                            Outline Button
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 items-center">
                                                        <div className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: primaryColor + '1a', color: primaryColor }}>
                                                            Badge
                                                        </div>
                                                        <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                                                            <div className="h-full w-3/4 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                                <CardFooter className="bg-muted/20 border-t border-border/50 flex justify-end py-3">
                                    <Button
                                        onClick={handleBrandingSave}
                                        disabled={isSaving || isSettingsLoading}
                                        className="gap-2 text-white"
                                        style={{ backgroundColor: primaryColor }}
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
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Team Members
                                                </CardTitle>
                                                <CardDescription>
                                                    Manage your platform administrators and instructors.
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => setShowInviteForm(!showInviteForm)}
                                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                            size="sm"
                                        >
                                            <UserPlus className="h-4 w-4" />
                                            Invite Member
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {/* Invite Form */}
                                    {showInviteForm && (
                                        <div className="p-4 border-b border-border/50 bg-emerald-50/30 dark:bg-emerald-500/5 space-y-3">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div className="space-y-1">
                                                    <Label htmlFor="inviteName" className="text-xs">Name</Label>
                                                    <Input id="inviteName" placeholder="Full name" value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor="inviteEmail" className="text-xs">Email</Label>
                                                    <Input id="inviteEmail" type="email" placeholder="email@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor="inviteRole" className="text-xs">Role</Label>
                                                    <Select
                                                        id="inviteRole"
                                                        options={[
                                                            { value: 'INSTRUCTOR', label: 'Instructor' },
                                                            { value: 'ADMIN', label: 'Admin' },
                                                        ]}
                                                        value={inviteRole}
                                                        onChange={(e) => setInviteRole(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <Button variant="outline" size="sm" onClick={() => setShowInviteForm(false)}>Cancel</Button>
                                                <Button size="sm" onClick={handleInviteTeamMember} disabled={isInviting} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                                                    {isInviting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
                                                    Send Invite
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Team List */}
                                    {isTeamLoading ? (
                                        <div className="flex justify-center py-12">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : teamMembers.length === 0 ? (
                                        <div className="text-center py-12 text-sm text-muted-foreground">
                                            <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                            <p>No team members found. Invite your first team member above.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-border/30">
                                            {teamMembers.map((member) => (
                                                <div key={member.id} className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors">
                                                    <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                                        {member.avatarUrl ? (
                                                            <img src={member.avatarUrl} alt={member.name} className="h-10 w-10 rounded-full object-cover" />
                                                        ) : (
                                                            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                                                {member.name?.charAt(0)?.toUpperCase() || '?'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{member.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                                    </div>
                                                    <Badge variant={member.role === 'ADMIN' ? 'default' : 'outline'} className="text-[10px]">
                                                        {member.role === 'ADMIN'
                                                            ? 'Admin'
                                                            : 'Instructor'}
                                                    </Badge>
                                                    <Badge
                                                        variant={
                                                            member.status === 'ACTIVE'
                                                                ? 'success'
                                                                : member.status === 'INVITED'
                                                                    ? 'default'
                                                                    : 'destructive'
                                                        }
                                                        className="text-[10px]"
                                                    >
                                                        {member.status}
                                                    </Badge>
                                                    <span className="text-[11px] text-muted-foreground hidden sm:block">
                                                        Joined {new Date(member.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        {member.status === 'INVITED' && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 px-2 text-[11px]"
                                                                onClick={() => handleResendInvite(member)}
                                                                disabled={teamActionLoading[member.id]}
                                                            >
                                                                {teamActionLoading[member.id] ? (
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                ) : (
                                                                    <Copy className="h-3 w-3" />
                                                                )}
                                                                Resend
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 px-2 text-[11px]"
                                                            onClick={() => handleToggleTeamMember(member)}
                                                            disabled={teamActionLoading[member.id]}
                                                        >
                                                            {teamActionLoading[member.id] ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : member.isActive ? (
                                                                <UserX className="h-3 w-3" />
                                                            ) : (
                                                                <UserCheck2 className="h-3 w-3" />
                                                            )}
                                                            {member.isActive ? 'Deactivate' : 'Activate'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Subscription Tab */}
                    {activeTab === 'subscription' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {isSubLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : subscription ? (
                                <>
                                    {/* Current Plan Card */}
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
                                            {(() => {
                                                const tier = PLAN_CATALOG.find(t => t.plan === subscription.plan);
                                                const currency = subscription.currency as CurrencyKey;
                                                const statusColors: Record<string, string> = {
                                                    ACTIVE: 'border-emerald-500/40 bg-emerald-500/10 dark:border-emerald-400/30 dark:bg-emerald-400/10',
                                                    TRIALING: 'border-blue-500/40 bg-blue-500/10 dark:border-blue-400/30 dark:bg-blue-400/10',
                                                    PAST_DUE: 'border-amber-500/40 bg-amber-500/10 dark:border-amber-400/30 dark:bg-amber-400/10',
                                                    CANCELLED: 'border-red-500/40 bg-red-500/10 dark:border-red-400/30 dark:bg-red-400/10',
                                                };
                                                const statusBadgeVariants: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
                                                    ACTIVE: 'success',
                                                    TRIALING: 'default',
                                                    PAST_DUE: 'warning',
                                                    CANCELLED: 'destructive',
                                                };
                                                const daysRemaining = Math.max(0, Math.ceil((new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

                                                return (
                                                    <>
                                                        <div className={`rounded-lg border-2 p-4 ${statusColors[subscription.status] || 'border-border'}`}>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <h3 className="text-base font-semibold tracking-tight text-emerald-700 dark:text-emerald-400">
                                                                        {subscription.plan} PLAN
                                                                    </h3>
                                                                    <Badge variant={statusBadgeVariants[subscription.status] || 'default'} className="text-[10px]">
                                                                        {subscription.status}
                                                                    </Badge>
                                                                </div>
                                                                <span className="font-semibold text-foreground">
                                                                    {formatPrice(subscription.price, currency)}/{subscription.billingCycle === 'YEARLY' ? 'year' : 'month'}
                                                                </span>
                                                            </div>
                                                            <div className="h-px bg-emerald-500/20 dark:bg-emerald-400/20 w-full my-3"></div>
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="text-muted-foreground">
                                                                    {tier?.stage || subscription.plan}
                                                                </span>
                                                                <span className="text-muted-foreground">
                                                                    {daysRemaining > 0
                                                                        ? `${daysRemaining} days until renewal`
                                                                        : 'Renewal due'
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Usage Meters */}
                                                        <div className="space-y-4">
                                                            <h4 className="text-sm font-medium">Current Usage</h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                {[
                                                                    { label: 'Students', used: subscription.usage.students, limit: subscription.studentLimit },
                                                                    { label: 'Mentors', used: subscription.usage.mentors, limit: subscription.mentorLimit },
                                                                    { label: 'Active Cohorts', used: subscription.usage.cohorts, limit: subscription.cohortLimit },
                                                                ].map(meter => {
                                                                    const pct = meter.limit > 0 ? (meter.used / meter.limit) * 100 : 0;
                                                                    const barColor = pct > 90 ? 'bg-red-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-500';
                                                                    return (
                                                                        <div key={meter.label} className="space-y-2">
                                                                            <div className="flex justify-between text-xs">
                                                                                <span className="text-muted-foreground">{meter.label}</span>
                                                                                <span className="font-medium">{meter.used} / {meter.limit}</span>
                                                                            </div>
                                                                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                                <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        {/* Overage Banner */}
                                                        {subscription.overage.count > 0 && (
                                                            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 flex items-center gap-2 text-sm">
                                                                <Activity className="h-4 w-4 text-amber-600 shrink-0" />
                                                                <span className="text-amber-800">
                                                                    <strong>{subscription.overage.count} students</strong> over your plan limit.
                                                                    Estimated overage: <strong>{formatPrice(subscription.overage.monthlyCost, currency)}/month</strong>
                                                                </span>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </CardContent>
                                    </Card>

                                    {/* Plan Comparison Grid */}
                                    <Card className="bg-white dark:bg-card border-border/50">
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                        Plans
                                                    </CardTitle>
                                                    <CardDescription>
                                                        Choose the right stage for your academy.
                                                    </CardDescription>
                                                </div>
                                                <div className="flex items-center gap-2 rounded-lg border p-1">
                                                    <button
                                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${subBillingToggle === 'MONTHLY' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                        onClick={() => setSubBillingToggle('MONTHLY')}
                                                    >
                                                        Monthly
                                                    </button>
                                                    <button
                                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${subBillingToggle === 'YEARLY' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                        onClick={() => setSubBillingToggle('YEARLY')}
                                                    >
                                                        Yearly
                                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">2 months free</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {(() => {
                                                const currency = (subscription.currency || 'INR') as CurrencyKey;

                                                const handlePlanChange = async (newPlan: string) => {
                                                    if (newPlan === subscription.plan) return;
                                                    setIsSubSaving(true);
                                                    try {
                                                        await apiClient.put('/api/v1/subscription', {
                                                            plan: newPlan,
                                                            billingCycle: subBillingToggle,
                                                            currency: subscription.currency,
                                                        });
                                                        const updated = await apiClient.get<import('@/types').Subscription>('/api/v1/subscription');
                                                        setSubscription(updated);
                                                        toast({ title: 'Plan Updated', description: `Switched to ${newPlan} plan.`, variant: 'success' });
                                                    } catch {
                                                        toast({ title: 'Error', description: 'Failed to update plan.', variant: 'error' });
                                                    } finally {
                                                        setIsSubSaving(false);
                                                    }
                                                };

                                                return (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        {PLAN_CATALOG.map((tier) => {
                                                            const isCurrent = tier.plan === subscription.plan;
                                                            const price = subBillingToggle === 'YEARLY' ? tier.yearlyPrice[currency] : tier.monthlyPrice[currency];
                                                            const isEnterprise = tier.plan === 'ENTERPRISE';
                                                            const isFree = tier.plan === 'FREE';
                                                            const isHigher = PLAN_CATALOG.findIndex(t => t.plan === tier.plan) > PLAN_CATALOG.findIndex(t => t.plan === subscription.plan);

                                                            return (
                                                                <div
                                                                    key={tier.plan}
                                                                    className={`relative rounded-xl border-2 p-5 flex flex-col transition-all ${isCurrent
                                                                        ? 'border-primary bg-primary/5 shadow-sm'
                                                                        : isFree
                                                                            ? 'border-border/50 bg-muted/30'
                                                                            : 'border-border hover:border-primary/30'
                                                                        }`}
                                                                >
                                                                    {/* Badges */}
                                                                    <div className="flex items-center gap-1.5 mb-3">
                                                                        {isCurrent && (
                                                                            <Badge variant="default" className="text-[10px]">Current Plan</Badge>
                                                                        )}
                                                                        {tier.recommended && !isCurrent && (
                                                                            <Badge variant="success" className="text-[10px]">Recommended</Badge>
                                                                        )}
                                                                    </div>

                                                                    {/* Stage */}
                                                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                                                        {tier.stage}
                                                                    </p>

                                                                    {/* Plan Name */}
                                                                    <h3 className="text-lg font-bold text-foreground mb-2">
                                                                        {tier.label}
                                                                    </h3>

                                                                    {/* Price */}
                                                                    <div className="mb-4">
                                                                        {isFree ? (
                                                                            <p className="text-2xl font-bold text-foreground">Free</p>
                                                                        ) : isEnterprise && subBillingToggle === 'YEARLY' ? (
                                                                            <p className="text-sm font-medium text-muted-foreground">Contact Sales</p>
                                                                        ) : (
                                                                            <p className="text-2xl font-bold text-foreground">
                                                                                {formatPrice(price, currency)}
                                                                                <span className="text-sm font-normal text-muted-foreground">
                                                                                    /{subBillingToggle === 'YEARLY' ? 'year' : 'month'}
                                                                                </span>
                                                                            </p>
                                                                        )}
                                                                    </div>

                                                                    {/* Limits */}
                                                                    <div className="space-y-1 mb-4 text-xs text-muted-foreground">
                                                                        <p>{tier.studentLimit >= 600 ? '600+' : tier.studentLimit} active students</p>
                                                                        <p>{tier.mentorLimit} mentors</p>
                                                                        <p>{tier.cohortLimit} cohorts</p>
                                                                    </div>

                                                                    {/* Features */}
                                                                    <div className="flex-1 space-y-1.5 mb-4">
                                                                        {tier.features.slice(0, 4).map((f) => (
                                                                            <div key={f} className="flex items-start gap-1.5 text-xs">
                                                                                <Check className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                                                                                <span className="text-muted-foreground">{f}</span>
                                                                            </div>
                                                                        ))}
                                                                        {tier.features.length > 4 && (
                                                                            <p className="text-[10px] text-muted-foreground pl-4">+{tier.features.length - 4} more</p>
                                                                        )}
                                                                    </div>

                                                                    {/* Action Button */}
                                                                    {isCurrent ? (
                                                                        <Button variant="outline" size="sm" disabled className="w-full mt-auto">
                                                                            Current Plan
                                                                        </Button>
                                                                    ) : isEnterprise ? (
                                                                        <Button variant="outline" size="sm" className="w-full mt-auto">
                                                                            Contact Sales
                                                                        </Button>
                                                                    ) : (
                                                                        <Button
                                                                            variant={isHigher ? 'primary' : 'outline'}
                                                                            size="sm"
                                                                            className="w-full mt-auto"
                                                                            onClick={() => handlePlanChange(tier.plan)}
                                                                            disabled={isSubSaving}
                                                                        >
                                                                            {isSubSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                                                            {isHigher ? 'Upgrade' : 'Downgrade'}
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}
                                        </CardContent>
                                        <CardFooter className="border-t pt-4">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Activity className="h-3.5 w-3.5" />
                                                <span>
                                                    Beyond your plan limit: overage of{' '}
                                                    {(() => {
                                                        const currency = (subscription.currency || 'INR') as CurrencyKey;
                                                        const tier = PLAN_CATALOG.find(t => t.plan === subscription.plan);
                                                        return tier ? formatPrice(tier.overageRate[currency], currency) : '₹299';
                                                    })()}{' '}
                                                    per additional active student/month. Scale smoothly without a forced upgrade.
                                                </span>
                                            </div>
                                        </CardFooter>
                                    </Card>
                                </>
                            ) : (
                                <Card>
                                    <CardContent className="py-8">
                                        <p className="text-sm text-muted-foreground text-center">
                                            Unable to load subscription data. Please try again.
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
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
                            {/* Password Policy */}
                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Key className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Password Policy</CardTitle>
                                            <CardDescription>Configure password requirements for all users.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label>Minimum Password Length: <span className="font-semibold text-emerald-600">{minPasswordLength}</span></Label>
                                        <input type="range" min={6} max={32} value={minPasswordLength} onChange={(e) => setMinPasswordLength(Number(e.target.value))} className="w-full accent-emerald-600" />
                                        <div className="flex justify-between text-[10px] text-muted-foreground"><span>6</span><span>32</span></div>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { id: 'reqUpper', label: 'Require uppercase letters', checked: requireUppercase, onChange: setRequireUppercase },
                                            { id: 'reqNumbers', label: 'Require numbers', checked: requireNumbers, onChange: setRequireNumbers },
                                            { id: 'reqSpecial', label: 'Require special characters (!@#$%)', checked: requireSpecialChars, onChange: setRequireSpecialChars },
                                        ].map(opt => (
                                            <div key={opt.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/20 transition-colors">
                                                <input type="checkbox" id={opt.id} checked={opt.checked} onChange={(e) => opt.onChange(e.target.checked)} className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                                <label htmlFor={opt.id} className="text-sm font-medium">{opt.label}</label>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Session Management */}
                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Session & Login</CardTitle>
                                            <CardDescription>Configure session timeout and login restrictions.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="sessionTimeout">Session Timeout</Label>
                                            <Select id="sessionTimeout" options={[
                                                { value: '15m', label: '15 minutes' },
                                                { value: '30m', label: '30 minutes' },
                                                { value: '1h', label: '1 hour' },
                                                { value: '4h', label: '4 hours' },
                                                { value: '24h', label: '24 hours' },
                                            ]} value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="maxLoginAttempts">Max Failed Login Attempts</Label>
                                            <Select id="maxLoginAttempts" options={[
                                                { value: '3', label: '3 attempts' },
                                                { value: '5', label: '5 attempts' },
                                                { value: '10', label: '10 attempts' },
                                            ]} value={String(maxLoginAttempts)} onChange={(e) => setMaxLoginAttempts(Number(e.target.value))} />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-muted/20 border-t border-border/50 flex justify-end py-3">
                                    <Button onClick={handleSave} disabled={isSaving || isSettingsLoading} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                                        <Save className="h-4 w-4" />
                                        {isSaving ? 'Saving...' : 'Save Security Settings'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    )}

                    {/* Integrations Tab */}
                    {activeTab === 'integrations' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Zoom */}
                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                                                <Video className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-sm font-semibold">Zoom</CardTitle>
                                                <CardDescription className="text-xs">Video conferencing for live sessions</CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={zoomEnabled ? 'success' : 'outline'} className="text-[10px]">{zoomEnabled ? 'Active' : 'Inactive'}</Badge>
                                            <input type="checkbox" checked={zoomEnabled} onChange={(e) => setZoomEnabled(e.target.checked)} className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                        </div>
                                    </div>
                                </CardHeader>
                                {zoomEnabled && (
                                    <CardContent className="space-y-3 pt-0">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">API Key</Label>
                                                <Input placeholder="Enter Zoom API Key" value={zoomApiKey} onChange={(e) => setZoomApiKey(e.target.value)} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">API Secret</Label>
                                                <div className="relative">
                                                    <Input type={showSecrets.zoom ? 'text' : 'password'} placeholder="Enter Zoom API Secret" value={zoomApiSecret} onChange={(e) => setZoomApiSecret(e.target.value)} />
                                                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowSecrets(p => ({ ...p, zoom: !p.zoom }))}>
                                                        {showSecrets.zoom ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>

                            {/* Google Meet */}
                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                                                <Video className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-sm font-semibold">Google Meet</CardTitle>
                                                <CardDescription className="text-xs">Google Workspace integration for meetings</CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={meetEnabled ? 'success' : 'outline'} className="text-[10px]">{meetEnabled ? 'Active' : 'Inactive'}</Badge>
                                            <input type="checkbox" checked={meetEnabled} onChange={(e) => setMeetEnabled(e.target.checked)} className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                        </div>
                                    </div>
                                </CardHeader>
                                {meetEnabled && (
                                    <CardContent className="space-y-3 pt-0">
                                        <div className="space-y-1">
                                            <Label className="text-xs">OAuth Client ID</Label>
                                            <Input placeholder="Enter Google OAuth Client ID" value={meetClientId} onChange={(e) => setMeetClientId(e.target.value)} />
                                        </div>
                                    </CardContent>
                                )}
                            </Card>

                            {/* WhatsApp Business */}
                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                                                <Phone className="h-5 w-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-sm font-semibold">WhatsApp Business</CardTitle>
                                                <CardDescription className="text-xs">Send notifications via WhatsApp Business API</CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={whatsappBizEnabled ? 'success' : 'outline'} className="text-[10px]">{whatsappBizEnabled ? 'Active' : 'Inactive'}</Badge>
                                            <input type="checkbox" checked={whatsappBizEnabled} onChange={(e) => setWhatsappBizEnabled(e.target.checked)} className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                        </div>
                                    </div>
                                </CardHeader>
                                {whatsappBizEnabled && (
                                    <CardContent className="space-y-3 pt-0">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Phone Number</Label>
                                                <Input placeholder="+91 9876543210" value={whatsappBizPhone} onChange={(e) => setWhatsappBizPhone(e.target.value)} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">API Token</Label>
                                                <div className="relative">
                                                    <Input type={showSecrets.whatsapp ? 'text' : 'password'} placeholder="Enter API Token" value={whatsappBizToken} onChange={(e) => setWhatsappBizToken(e.target.value)} />
                                                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowSecrets(p => ({ ...p, whatsapp: !p.whatsapp }))}>
                                                        {showSecrets.whatsapp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>

                            {/* Webhook */}
                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                                                <Link2 className="h-5 w-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-sm font-semibold">Webhooks</CardTitle>
                                                <CardDescription className="text-xs">Send event notifications to external services</CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={webhookEnabled ? 'success' : 'outline'} className="text-[10px]">{webhookEnabled ? 'Active' : 'Inactive'}</Badge>
                                            <input type="checkbox" checked={webhookEnabled} onChange={(e) => setWebhookEnabled(e.target.checked)} className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                        </div>
                                    </div>
                                </CardHeader>
                                {webhookEnabled && (
                                    <CardContent className="space-y-3 pt-0">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Webhook URL</Label>
                                            <Input placeholder="https://your-service.com/webhook" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} />
                                            <p className="text-[10px] text-muted-foreground">Events (enrollment, grading, submissions) will POST to this URL.</p>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>

                            <div className="flex justify-end">
                                <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                                    <Save className="h-4 w-4" />
                                    {isSaving ? 'Saving...' : 'Save Integrations'}
                                </Button>
                            </div>
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
                            {/* Data Overview */}
                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Data Overview</CardTitle>
                                            <CardDescription>Summary of data stored in your platform.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: 'Students', count: dataCounts.students, icon: Users, color: 'text-blue-600 bg-blue-100 dark:bg-blue-500/20' },
                                            { label: 'Mentors', count: dataCounts.mentors, icon: Users, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20' },
                                            { label: 'Cohorts', count: dataCounts.cohorts, icon: Database, color: 'text-purple-600 bg-purple-100 dark:bg-purple-500/20' },
                                            { label: 'Courses', count: dataCounts.courses, icon: Layout, color: 'text-amber-600 bg-amber-100 dark:bg-amber-500/20' },
                                        ].map(item => (
                                            <div key={item.label} className="rounded-lg border border-border/50 p-4 text-center">
                                                <div className={`h-10 w-10 rounded-full ${item.color} flex items-center justify-center mx-auto mb-2`}>
                                                    <item.icon className="h-5 w-5" />
                                                </div>
                                                <p className="text-2xl font-bold">{item.count}</p>
                                                <p className="text-xs text-muted-foreground">{item.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Export Data */}
                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Export Data</CardTitle>
                                            <CardDescription>Download your data as CSV files.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="space-y-3">
                                        {[
                                            { entity: 'students', label: 'Students', description: 'Names, emails, enrollment dates, cohorts', icon: Users },
                                            { entity: 'mentors', label: 'Mentors', description: 'Names, emails, specialties, assigned cohorts', icon: Users },
                                            { entity: 'cohorts', label: 'Cohorts', description: 'Cohort names, programs, dates, student counts', icon: Database },
                                        ].map(item => (
                                            <div key={item.entity} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <item.icon className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">{item.label}</p>
                                                        <p className="text-xs text-muted-foreground">{item.description}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2"
                                                    onClick={() => handleExportCSV(item.entity)}
                                                    disabled={isExporting === item.entity}
                                                >
                                                    {isExporting === item.entity ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                                                    Export CSV
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
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
