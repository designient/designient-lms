'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Drawer, DrawerSection, DrawerDivider } from '@/components/ui/Drawer';
import { useToast } from '@/components/ui/Toast';
import {
    Send,
    Mail,
    MessageCircle,
    Smartphone,
    FileText,
    Clock,
    History,
    Plus,
    Edit2,
    Trash2,
    Copy,
    Users,
    CheckCircle,
    XCircle,
    Calendar,
    Search,
    Filter,
    X
} from 'lucide-react';
import { MessageTemplate } from '@/types';
import { apiClient } from '@/lib/api-client';

// Built-in templates (client-side — no DB model for templates yet)
const builtInTemplates: MessageTemplate[] = [
    {
        id: 'TPL-001',
        name: 'Welcome Email',
        category: 'welcome',
        subject: "Welcome to {{cohort_name}} - Let's Begin Your Journey!",
        body: "Hi {{student_name}},\n\nWelcome to Designient! We're thrilled to have you join {{cohort_name}}.\n\nYour mentor {{mentor_name}} will reach out shortly to schedule your first session.\n\nBest regards,\nTeam Designient",
        channel: 'email',
        variables: ['{{student_name}}', '{{cohort_name}}', '{{mentor_name}}'],
        status: 'active',
        usageCount: 0,
        createdAt: 'Jan 10, 2024',
        updatedAt: 'Jan 10, 2024'
    },
    {
        id: 'TPL-002',
        name: 'Payment Reminder',
        category: 'payment',
        subject: 'Payment Reminder - {{amount}} Due',
        body: 'Hi {{student_name}},\n\nThis is a friendly reminder that your payment of {{amount}} for {{cohort_name}} is due on {{due_date}}.\n\nPlease complete the payment to continue your learning journey.\n\nPayment Link: {{payment_link}}\n\nBest regards,\nTeam Designient',
        channel: 'email',
        variables: ['{{student_name}}', '{{amount}}', '{{cohort_name}}', '{{due_date}}', '{{payment_link}}'],
        status: 'active',
        usageCount: 0,
        createdAt: 'Jan 15, 2024',
        updatedAt: 'Jan 15, 2024'
    },
    {
        id: 'TPL-003',
        name: 'Session Reminder (WhatsApp)',
        category: 'session',
        subject: '',
        body: 'Hi {{student_name}}! 👋\n\nReminder: Your mentoring session with {{mentor_name}} is scheduled for tomorrow at {{session_time}}.\n\nJoin link: {{meeting_link}}\n\nSee you there! 🎯',
        channel: 'whatsapp',
        variables: ['{{student_name}}', '{{mentor_name}}', '{{session_time}}', '{{meeting_link}}'],
        status: 'active',
        usageCount: 0,
        createdAt: 'Jan 20, 2024',
        updatedAt: 'Jan 20, 2024'
    },
    {
        id: 'TPL-004',
        name: 'Cohort Completion',
        category: 'notification',
        subject: "Congratulations! You've Completed {{cohort_name}}",
        body: "Dear {{student_name}},\n\nCongratulations on successfully completing {{cohort_name}}! 🎉\n\nYour certificate is ready for download. You can access it from your dashboard.\n\nWe'd love to hear about your experience. Please take a moment to share your feedback.\n\nBest wishes for your design journey!\n\nTeam Designient",
        channel: 'email',
        variables: ['{{student_name}}', '{{cohort_name}}'],
        status: 'active',
        usageCount: 0,
        createdAt: 'Feb 1, 2024',
        updatedAt: 'Feb 1, 2024'
    }
];

// API response types
interface ApiMessage {
    id: string;
    subject: string;
    body: string;
    channel: string;
    status: string;
    recipientType: string;
    recipientCount: number;
    sentAt: string | null;
    scheduledAt: string | null;
    senderId: string;
    createdAt: string;
    updatedAt: string;
    sender: { name: string };
}

type CommunicationsTab = 'compose' | 'templates' | 'history' | 'scheduled';

interface CommunicationsPageProps {
    initialRecipient?: {
        type: 'individual' | 'cohort';
        id: string;
        name: string;
    } | null;
}

export default function CommunicationsPage({
    initialRecipient
}: CommunicationsPageProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<CommunicationsTab>('compose');
    const [templates, setTemplates] =
        useState<MessageTemplate[]>(builtInTemplates);
    const [messages, setMessages] = useState<ApiMessage[]>([]);
    const [scheduledMessages, setScheduledMessages] = useState<ApiMessage[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    // Drawer states
    const [isTemplateDrawerOpen, setIsTemplateDrawerOpen] = useState(false);
    const [templateDrawerMode, setTemplateDrawerMode] = useState<
        'create' | 'edit' | 'view'
    >('create');
    const [editingTemplate, setEditingTemplate] =
        useState<MessageTemplate | null>(null);
    // Template Form State
    const [templateForm, setTemplateForm] = useState({
        name: '',
        category: 'custom',
        subject: '',
        body: '',
        channel: 'email',
        status: 'active'
    });
    // Confirmation states
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
        null
    );
    const [showCancelScheduleConfirm, setShowCancelScheduleConfirm] = useState<
        string | null
    >(null);
    const [showSendConfirm, setShowSendConfirm] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    // Compose form state
    const [composeChannel, setComposeChannel] = useState('email');
    const [composeRecipientType, setComposeRecipientType] = useState('cohort');
    const [composeCohort, setComposeCohort] = useState('');
    const [composeSubject, setComposeSubject] = useState('');
    const [composeBody, setComposeBody] = useState('');
    const [cohortOptionsForCompose, setCohortOptionsForCompose] = useState<{ value: string; label: string }[]>([]);

    // Load cohorts, message history, and scheduled messages from APIs
    const loadData = useCallback(async () => {
        setLoadingMessages(true);
        try {
            const [cohortsRes, historyRes, scheduledRes] = await Promise.all([
                apiClient.get<{ cohorts: Array<{ id: string; name: string; _count?: { students: number } }> }>('/api/v1/cohorts?limit=50').catch(() => ({ cohorts: [] })),
                apiClient.get<{ messages: ApiMessage[]; pagination: { total: number } }>('/api/v1/communications?limit=50').catch(() => ({ messages: [], pagination: { total: 0 } })),
                apiClient.get<{ messages: ApiMessage[] }>('/api/v1/communications/scheduled').catch(() => ({ messages: [] })),
            ]);

            setCohortOptionsForCompose(cohortsRes.cohorts.map(c => ({
                value: c.id,
                label: `${c.name} (${c._count?.students ?? 0} students)`,
            })));
            setMessages(historyRes.messages);
            setScheduledMessages(scheduledRes.messages);
        } catch (e) {
            // silently handle
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handle initial recipient
    useEffect(() => {
        if (initialRecipient) {
            setActiveTab('compose');
            setComposeRecipientType(initialRecipient.type);
            if (initialRecipient.type === 'cohort') {
                setComposeCohort(initialRecipient.id);
            }
        }
    }, [initialRecipient]);

    const handleNavigate = (page: PageName) => {
        router.push(`/${page}`);
    };

    const tabs: {
        id: CommunicationsTab;
        label: string;
        icon: any;
    }[] = [
            {
                id: 'compose',
                label: 'Compose',
                icon: Send
            },
            {
                id: 'templates',
                label: 'Templates',
                icon: FileText
            },
            {
                id: 'history',
                label: 'History',
                icon: History
            },
            {
                id: 'scheduled',
                label: 'Scheduled',
                icon: Clock
            }
        ];

    const getChannelIcon = (channel: string) => {
        switch (channel.toLowerCase()) {
            case 'email':
                return <Mail className="h-4 w-4" />;
            case 'whatsapp':
                return <MessageCircle className="h-4 w-4" />;
            case 'sms':
                return <Smartphone className="h-4 w-4" />;
            default:
                return <Mail className="h-4 w-4" />;
        }
    };

    const getChannelColor = (channel: string) => {
        switch (channel.toLowerCase()) {
            case 'email':
                return 'bg-blue-100 text-blue-600';
            case 'whatsapp':
                return 'bg-emerald-100 text-emerald-600';
            case 'sms':
                return 'bg-purple-100 text-purple-600';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status.toUpperCase()) {
            case 'DELIVERED':
            case 'SENT':
                return <Badge variant="success">{status}</Badge>;
            case 'PARTIAL':
                return <Badge variant="warning">Partial</Badge>;
            case 'FAILED':
                return <Badge variant="destructive">Failed</Badge>;
            case 'SCHEDULED':
                return <Badge variant="neutral">Scheduled</Badge>;
            case 'CANCELLED':
                return <Badge variant="secondary">Cancelled</Badge>;
            case 'DRAFT':
                return <Badge variant="neutral">Draft</Badge>;
            default:
                return <Badge variant="neutral">{status}</Badge>;
        }
    };

    const getCategoryBadge = (category: string) => {
        const colors: Record<string, string> = {
            welcome: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            reminder: 'bg-amber-50 text-amber-700 border-amber-200',
            notification: 'bg-blue-50 text-blue-700 border-blue-200',
            payment: 'bg-purple-50 text-purple-700 border-purple-200',
            session: 'bg-cyan-50 text-cyan-700 border-cyan-200',
            custom: 'bg-gray-50 text-gray-700 border-gray-200'
        };
        return (
            <span
                className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium capitalize ${colors[category] || colors.custom
                    }`}
            >
                {category}
            </span>
        );
    };

    const handleCreateTemplate = () => {
        setEditingTemplate(null);
        setTemplateForm({
            name: '',
            category: 'custom',
            subject: '',
            body: '',
            channel: 'email',
            status: 'active'
        });
        setTemplateDrawerMode('create');
        setIsTemplateDrawerOpen(true);
    };

    const handleEditTemplate = (template: MessageTemplate) => {
        setEditingTemplate(template);
        setTemplateForm({
            name: template.name,
            category: template.category,
            subject: template.subject,
            body: template.body,
            channel: template.channel,
            status: template.status
        });
        setTemplateDrawerMode('edit');
        setIsTemplateDrawerOpen(true);
    };

    const handleSaveTemplate = () => {
        if (templateDrawerMode === 'create') {
            const newTemplate: MessageTemplate = {
                id: `TPL-${String(templates.length + 1).padStart(3, '0')}`,
                name: templateForm.name,
                category: templateForm.category as any,
                subject: templateForm.subject,
                body: templateForm.body,
                channel: templateForm.channel as any,
                variables: [],
                status: templateForm.status as any,
                usageCount: 0,
                createdAt: new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }),
                updatedAt: new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })
            };
            setTemplates((prev) => [newTemplate, ...prev]);
            toast({
                title: 'Template Created',
                description: `"${newTemplate.name}" has been created.`,
                variant: 'success'
            });
        } else if (templateDrawerMode === 'edit' && editingTemplate) {
            const updatedTemplate: MessageTemplate = {
                ...editingTemplate,
                name: templateForm.name,
                category: templateForm.category as any,
                subject: templateForm.subject,
                body: templateForm.body,
                channel: templateForm.channel as any,
                status: templateForm.status as any,
                updatedAt: new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })
            };
            setTemplates((prev) =>
                prev.map((t) => (t.id === editingTemplate.id ? updatedTemplate : t))
            );
            toast({
                title: 'Template Updated',
                description: `"${updatedTemplate.name}" has been updated.`,
                variant: 'success'
            });
        }
        setIsTemplateDrawerOpen(false);
    };

    const handleDuplicateTemplate = (template: MessageTemplate) => {
        const newTemplate: MessageTemplate = {
            ...template,
            id: `TPL-${String(templates.length + 1).padStart(3, '0')}`,
            name: `${template.name} (Copy)`,
            status: 'draft',
            usageCount: 0,
            createdAt: new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }),
            updatedAt: new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            })
        };
        setTemplates((prev) => [newTemplate, ...prev]);
        toast({
            title: 'Template Duplicated',
            description: `Created "${newTemplate.name}" as a draft.`,
            variant: 'success'
        });
    };

    const handleDeleteTemplate = (templateId: string) => {
        const template = templates.find((t) => t.id === templateId);
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
        setShowDeleteConfirm(null);
        toast({
            title: 'Template Deleted',
            description: `"${template?.name}" has been deleted.`,
            variant: 'success'
        });
    };

    const handleSendMessage = async () => {
        setSendingMessage(true);
        try {
            const recipientTypeMap: Record<string, string> = {
                individual: 'INDIVIDUAL',
                cohort: 'COHORT',
                all_students: 'ALL_STUDENTS',
                all_mentors: 'ALL_MENTORS',
                custom: 'CUSTOM',
            };
            const channelMap: Record<string, string> = {
                email: 'EMAIL',
                whatsapp: 'WHATSAPP',
                sms: 'SMS',
            };

            await apiClient.post('/api/v1/communications', {
                subject: composeSubject || '(No Subject)',
                body: composeBody,
                channel: channelMap[composeChannel] || 'EMAIL',
                recipientType: recipientTypeMap[composeRecipientType] || 'ALL_STUDENTS',
            });

            toast({
                title: 'Message Sent',
                description: `Your message has been sent to ${composeRecipientType === 'cohort'
                    ? 'the selected cohort'
                    : 'recipients'
                    }.`,
                variant: 'success'
            });
            setShowSendConfirm(false);
            setComposeSubject('');
            setComposeBody('');
            setSelectedTemplate('');
            // Reload messages
            loadData();
        } catch (error) {
            toast({
                title: 'Send Failed',
                description: 'Failed to send message. Please try again.',
                variant: 'error'
            });
        } finally {
            setSendingMessage(false);
            setShowSendConfirm(false);
        }
    };

    const handleScheduleMessage = async () => {
        setSendingMessage(true);
        try {
            const recipientTypeMap: Record<string, string> = {
                individual: 'INDIVIDUAL',
                cohort: 'COHORT',
                all_students: 'ALL_STUDENTS',
                all_mentors: 'ALL_MENTORS',
                custom: 'CUSTOM',
            };
            const channelMap: Record<string, string> = {
                email: 'EMAIL',
                whatsapp: 'WHATSAPP',
                sms: 'SMS',
            };

            const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();

            await apiClient.post('/api/v1/communications', {
                subject: composeSubject || '(No Subject)',
                body: composeBody,
                channel: channelMap[composeChannel] || 'EMAIL',
                recipientType: recipientTypeMap[composeRecipientType] || 'ALL_STUDENTS',
                scheduledAt,
            });

            toast({
                title: 'Message Scheduled',
                description: `Your message will be sent on ${scheduleDate} at ${scheduleTime}.`,
                variant: 'success'
            });
            setShowScheduleModal(false);
            setScheduleDate('');
            setScheduleTime('');
            setComposeSubject('');
            setComposeBody('');
            // Reload data
            loadData();
        } catch (error) {
            toast({
                title: 'Schedule Failed',
                description: 'Failed to schedule message. Please try again.',
                variant: 'error'
            });
        } finally {
            setSendingMessage(false);
            setShowScheduleModal(false);
        }
    };

    const handleCancelScheduled = async (messageId: string) => {
        try {
            // Update the message status to CANCELLED via the communications API
            await apiClient.put(`/api/v1/communications`, { id: messageId, status: 'CANCELLED' }).catch(() => {
                // If dedicated cancel endpoint doesn't exist, update locally
                setScheduledMessages((prev) =>
                    prev.filter((m) => m.id !== messageId)
                );
            });
            setShowCancelScheduleConfirm(null);
            toast({
                title: 'Message Cancelled',
                description: 'The scheduled message has been cancelled.',
                variant: 'info'
            });
            loadData();
        } catch {
            setShowCancelScheduleConfirm(null);
            toast({
                title: 'Cancel Failed',
                description: 'Failed to cancel the scheduled message.',
                variant: 'error'
            });
        }
    };

    const handleUseTemplate = (templateId: string) => {
        const template = templates.find((t) => t.id === templateId);
        if (template) {
            setSelectedTemplate(templateId);
            setComposeChannel(template.channel);
            setComposeSubject(template.subject);
            setComposeBody(template.body);
        }
    };

    const filteredTemplates = templates.filter(
        (t) =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout
            title="Communications"
            subtitle="Send messages and manage templates"
            currentPage="communications"
            onNavigate={handleNavigate}
        >
            <div className="space-y-6">
                {/* Stats Overview */}
                <div className="grid gap-6 md:grid-cols-4">
                    <Card className="p-5 bg-white dark:bg-card border-border/50">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <Send className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">
                                    {messages.filter(m => m.status === 'SENT').length}
                                </p>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Messages Sent
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-5 bg-white dark:bg-card border-border/50">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">
                                    {messages.length > 0
                                        ? `${Math.round((messages.filter(m => m.status === 'SENT').length / messages.length) * 100)}%`
                                        : '—'}
                                </p>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Delivery Rate
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-5 bg-white dark:bg-card border-border/50">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Mail className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">
                                    {messages.reduce((sum, m) => sum + m.recipientCount, 0)}
                                </p>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Total Recipients
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-5 bg-white dark:bg-card border-border/50">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                                <Clock className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">
                                    {scheduledMessages.length}
                                </p>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Scheduled
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Tabs Navigation */}
                <div className="border-b border-border/50 overflow-x-auto">
                    <nav className="flex space-x-1" aria-label="Tabs">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`group inline-flex items-center py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${isActive
                                        ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50 dark:bg-emerald-500/10 dark:text-emerald-400'
                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                                        }`}
                                >
                                    <tab.icon
                                        className={`-ml-0.5 mr-2 h-4 w-4 ${isActive
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-muted-foreground group-hover:text-foreground'
                                            }`}
                                    />
                                    {tab.label}
                                    {tab.id === 'scheduled' &&
                                        scheduledMessages.filter((m) => m.status === 'scheduled')
                                            .length > 0 && (
                                            <span className="ml-2 bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                {
                                                    scheduledMessages.filter(
                                                        (m) => m.status === 'scheduled'
                                                    ).length
                                                }
                                            </span>
                                        )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Compose Tab */}
                {activeTab === 'compose' && (
                    <div className="grid gap-6 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardHeader>
                                    <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                        Compose Message
                                    </CardTitle>
                                    <CardDescription>
                                        Send a message to students, mentors, or specific groups.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label>Channel</Label>
                                            <Select
                                                options={[
                                                    { value: 'email', label: '📧 Email' },
                                                    { value: 'whatsapp', label: '💬 WhatsApp' },
                                                    { value: 'sms', label: '📱 SMS' }
                                                ]}
                                                value={composeChannel}
                                                onChange={(e) => setComposeChannel(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Template (Optional)</Label>
                                            <Select
                                                placeholder="Select a template"
                                                options={templates
                                                    .filter((t) => t.status === 'active')
                                                    .map((t) => ({
                                                        value: t.id,
                                                        label: t.name
                                                    }))}
                                                value={selectedTemplate}
                                                onChange={(e) => handleUseTemplate(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>Recipients</Label>
                                        <Select
                                            options={[
                                                { value: 'individual', label: 'Individual Student/Mentor' },
                                                { value: 'cohort', label: 'Entire Cohort' },
                                                { value: 'all_students', label: 'All Students' },
                                                { value: 'all_mentors', label: 'All Mentors' },
                                                { value: 'custom', label: 'Custom Selection' }
                                            ]}
                                            value={composeRecipientType}
                                            onChange={(e) => setComposeRecipientType(e.target.value)}
                                        />
                                        {initialRecipient &&
                                            initialRecipient.type === 'individual' &&
                                            composeRecipientType === 'individual' && (
                                                <p className="text-xs text-emerald-600 font-medium mt-1">
                                                    Sending to: {initialRecipient.name}
                                                </p>
                                            )}
                                    </div>

                                    {composeRecipientType === 'cohort' && (
                                        <div className="space-y-1.5">
                                            <Label>Select Cohort</Label>
                                            <Select
                                                placeholder="Choose a cohort"
                                                options={cohortOptionsForCompose}
                                                value={composeCohort}
                                                onChange={(e) => setComposeCohort(e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {composeChannel === 'email' && (
                                        <div className="space-y-1.5">
                                            <Label>Subject</Label>
                                            <Input
                                                placeholder="Enter message subject..."
                                                value={composeSubject}
                                                onChange={(e) => setComposeSubject(e.target.value)}
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label>Message</Label>
                                            <span className="text-xs text-muted-foreground">
                                                Variables: {'{{student_name}}'}, {'{{cohort_name}}'},{' '}
                                                {'{{mentor_name}}'}
                                            </span>
                                        </div>
                                        <Textarea
                                            placeholder="Type your message here..."
                                            rows={6}
                                            className="resize-none"
                                            value={composeBody}
                                            onChange={(e) => setComposeBody(e.target.value)}
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-muted/20 border-t border-border/50 flex justify-between py-3">
                                    <Button
                                        variant="outline"
                                        className="gap-2"
                                        onClick={() => setShowScheduleModal(true)}
                                        disabled={!composeBody.trim()}
                                    >
                                        <Clock className="h-4 w-4" />
                                        Schedule
                                    </Button>
                                    <Button
                                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                        onClick={() => setShowSendConfirm(true)}
                                        disabled={!composeBody.trim()}
                                    >
                                        <Send className="h-4 w-4" />
                                        Send Now
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Quick Templates</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {templates
                                        .filter((t) => t.status === 'active')
                                        .slice(0, 4)
                                        .map((template) => (
                                            <button
                                                key={template.id}
                                                className="w-full p-3 rounded-lg border border-border/50 hover:border-emerald-300 hover:bg-muted/30 transition-colors text-left"
                                                onClick={() => handleUseTemplate(template.id)}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div
                                                        className={`h-6 w-6 rounded flex items-center justify-center ${getChannelColor(
                                                            template.channel
                                                        )}`}
                                                    >
                                                        {getChannelIcon(template.channel)}
                                                    </div>
                                                    <span className="text-sm font-medium">
                                                        {template.name}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {template.subject || template.body.substring(0, 60)}
                                                    ...
                                                </p>
                                            </button>
                                        ))}
                                </CardContent>
                            </Card>

                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Channel Stats</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <Mail className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <span className="text-sm">Email</span>
                                        </div>
                                        <span className="text-sm font-medium">{messages.filter(m => m.channel === 'EMAIL').length} sent</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                <MessageCircle className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            <span className="text-sm">WhatsApp</span>
                                        </div>
                                        <span className="text-sm font-medium">{messages.filter(m => m.channel === 'WHATSAPP').length} sent</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                                <Smartphone className="h-4 w-4 text-purple-600" />
                                            </div>
                                            <span className="text-sm">SMS</span>
                                        </div>
                                        <span className="text-sm font-medium">{messages.filter(m => m.channel === 'SMS').length} sent</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Templates Tab */}
                {activeTab === 'templates' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between">
                            <div className="relative w-64">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search templates..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button
                                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={handleCreateTemplate}
                            >
                                <Plus className="h-4 w-4" />
                                Create Template
                            </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredTemplates.map((template) => (
                                <Card
                                    key={template.id}
                                    className={`bg-white dark:bg-card border-border/50 ${template.status === 'draft' ? 'opacity-70' : ''
                                        }`}
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`h-8 w-8 rounded-lg flex items-center justify-center ${getChannelColor(
                                                        template.channel
                                                    )}`}
                                                >
                                                    {getChannelIcon(template.channel)}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-sm">
                                                        {template.name}
                                                    </CardTitle>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        {getCategoryBadge(template.category)}
                                                        {template.status === 'draft' && (
                                                            <Badge variant="neutral" className="text-[9px]">
                                                                Draft
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pb-3">
                                        {template.subject && (
                                            <p className="text-xs font-medium text-foreground mb-1 truncate">
                                                {template.subject}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {template.body.substring(0, 100)}...
                                        </p>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {template.variables.slice(0, 3).map((variable) => (
                                                <code
                                                    key={variable}
                                                    className="text-[9px] bg-muted px-1 py-0.5 rounded"
                                                >
                                                    {variable}
                                                </code>
                                            ))}
                                            {template.variables.length > 3 && (
                                                <code className="text-[9px] bg-muted px-1 py-0.5 rounded">
                                                    +{template.variables.length - 3}
                                                </code>
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-0 flex items-center justify-between">
                                        <span className="text-[10px] text-muted-foreground">
                                            Used {template.usageCount} times
                                        </span>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0"
                                                onClick={() => handleDuplicateTemplate(template)}
                                                title="Duplicate"
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0"
                                                onClick={() => handleEditTemplate(template)}
                                                title="Edit"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            {showDeleteConfirm === template.id ? (
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0"
                                                        onClick={() => setShowDeleteConfirm(null)}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                        onClick={() => handleDeleteTemplate(template.id)}
                                                    >
                                                        <CheckCircle className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                    onClick={() => setShowDeleteConfirm(template.id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative w-64">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Search messages..." className="pl-9" />
                                </div>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Filter className="h-3.5 w-3.5" />
                                    Filter
                                </Button>
                            </div>
                        </div>

                        <Card className="bg-white dark:bg-card border-border/50">
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/50">
                                    {loadingMessages ? (
                                        <div className="p-8 text-center text-muted-foreground">
                                            Loading messages...
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground">
                                            No messages sent yet. Go to Compose to send your first message.
                                        </div>
                                    ) : messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className={`h-10 w-10 rounded-lg flex items-center justify-center ${getChannelColor(
                                                        message.channel
                                                    )}`}
                                                >
                                                    {getChannelIcon(message.channel)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium">
                                                            {message.subject ||
                                                                'Message'}
                                                        </p>
                                                        {getStatusBadge(message.status)}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-3 w-3" />
                                                            {message.recipientCount} recipients
                                                        </span>
                                                        <span>•</span>
                                                        <span>
                                                            {message.recipientType === 'COHORT'
                                                                ? 'Cohort'
                                                                : message.recipientType === 'ALL_STUDENTS'
                                                                    ? 'All Students'
                                                                    : message.recipientType === 'INDIVIDUAL'
                                                                        ? 'Individual'
                                                                        : message.recipientType === 'ALL_MENTORS'
                                                                            ? 'All Mentors'
                                                                            : 'Custom'}
                                                        </span>
                                                        <span>•</span>
                                                        <span>by {message.sender?.name || 'Unknown'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-3 text-xs">
                                                    <div className="flex items-center gap-1 text-emerald-600">
                                                        <CheckCircle className="h-3.5 w-3.5" />
                                                        {message.recipientCount}
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                    {message.sentAt
                                                        ? new Date(message.sentAt).toLocaleString()
                                                        : new Date(message.createdAt).toLocaleString()}
                                                </p>
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

                {/* Scheduled Tab */}
                {activeTab === 'scheduled' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {scheduledMessages.length >
                            0 ? (
                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardHeader>
                                    <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                        Scheduled Messages
                                    </CardTitle>
                                    <CardDescription>
                                        Messages queued for future delivery.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-border/50">
                                        {scheduledMessages
                                            .map((message) => (
                                                <div
                                                    key={message.id}
                                                    className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className={`h-10 w-10 rounded-lg flex items-center justify-center ${getChannelColor(
                                                                message.channel
                                                            )}`}
                                                        >
                                                            {getChannelIcon(message.channel)}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-medium">
                                                                    {message.subject ||
                                                                        'Scheduled Message'}
                                                                </p>
                                                                {getStatusBadge(message.status)}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                                <span className="flex items-center gap-1">
                                                                    <Users className="h-3 w-3" />
                                                                    {message.recipientCount} recipients
                                                                </span>
                                                                <span>•</span>
                                                                <span>by {message.sender?.name || 'Unknown'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-right">
                                                            <div className="flex items-center gap-1.5 text-amber-600">
                                                                <Calendar className="h-3.5 w-3.5" />
                                                                <span className="text-xs font-medium">
                                                                    {message.scheduledAt
                                                                        ? new Date(message.scheduledAt).toLocaleString()
                                                                        : 'TBD'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            {showCancelScheduleConfirm === message.id ? (
                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 w-8 p-0"
                                                                        onClick={() =>
                                                                            setShowCancelScheduleConfirm(null)
                                                                        }
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                                        onClick={() =>
                                                                            handleCancelScheduled(message.id)
                                                                        }
                                                                    >
                                                                        <CheckCircle className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                                    onClick={() =>
                                                                        setShowCancelScheduleConfirm(message.id)
                                                                    }
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="p-8 bg-white dark:bg-card border-border/50">
                                <div className="text-center">
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                                        <Clock className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium mb-1">
                                        No Scheduled Messages
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        You don't have any messages scheduled for delivery.
                                    </p>
                                    <Button
                                        onClick={() => setActiveTab('compose')}
                                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Schedule a Message
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {/* Send Confirmation Modal */}
                {showSendConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowSendConfirm(false)}
                        />
                        <div className="relative z-50 w-full max-w-md mx-4 bg-background rounded-xl shadow-xl border border-border/60 overflow-hidden">
                            <div className="p-6 space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                        <Send className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">Send Message?</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            This will send your message to{' '}
                                            {composeRecipientType === 'cohort'
                                                ? 'the selected cohort'
                                                : composeRecipientType === 'all_students'
                                                    ? 'all students (186)'
                                                    : 'the selected recipients'}
                                            .
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 px-6 py-4 border-t border-border bg-muted/30">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowSendConfirm(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSendMessage}
                                    className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    <Send className="h-4 w-4" />
                                    Send Now
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Schedule Modal */}
                {showScheduleModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowScheduleModal(false)}
                        />
                        <div className="relative z-50 w-full max-w-md mx-4 bg-background rounded-xl shadow-xl border border-border/60 overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                                <div>
                                    <h2 className="text-lg font-semibold">Schedule Message</h2>
                                    <p className="text-sm text-muted-foreground">
                                        Choose when to send this message
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowScheduleModal(false)}
                                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                                >
                                    <X className="h-4 w-4 text-muted-foreground" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <Label>Date</Label>
                                    <Input
                                        type="date"
                                        value={scheduleDate}
                                        onChange={(e) => setScheduleDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Time</Label>
                                    <Input
                                        type="time"
                                        value={scheduleTime}
                                        onChange={(e) => setScheduleTime(e.target.value)}
                                    />
                                </div>
                                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                                    <p className="text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3 inline mr-1" />
                                        Message will be sent to{' '}
                                        {composeRecipientType === 'cohort'
                                            ? 'the selected cohort'
                                            : 'recipients'}{' '}
                                        at the scheduled time.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 px-6 py-4 border-t border-border bg-muted/30">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowScheduleModal(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleScheduleMessage}
                                    className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={!scheduleDate || !scheduleTime}
                                >
                                    <Calendar className="h-4 w-4" />
                                    Schedule
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Template Drawer */}
                <Drawer
                    open={isTemplateDrawerOpen}
                    onClose={() => setIsTemplateDrawerOpen(false)}
                    title={
                        templateDrawerMode === 'create' ? 'Create Template' : 'Edit Template'
                    }
                    size="md"
                    footer={
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsTemplateDrawerOpen(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveTemplate}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={!templateForm.name || !templateForm.body}
                            >
                                {templateDrawerMode === 'create'
                                    ? 'Create Template'
                                    : 'Save Changes'}
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-6">
                        <DrawerSection title="Template Details">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label>Template Name</Label>
                                    <Input
                                        placeholder="e.g., Welcome Email"
                                        value={templateForm.name}
                                        onChange={(e) =>
                                            setTemplateForm({
                                                ...templateForm,
                                                name: e.target.value
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label>Category</Label>
                                        <Select
                                            options={[
                                                { value: 'welcome', label: 'Welcome' },
                                                { value: 'reminder', label: 'Reminder' },
                                                { value: 'notification', label: 'Notification' },
                                                { value: 'payment', label: 'Payment' },
                                                { value: 'session', label: 'Session' },
                                                { value: 'custom', label: 'Custom' }
                                            ]}
                                            value={templateForm.category}
                                            onChange={(e) =>
                                                setTemplateForm({
                                                    ...templateForm,
                                                    category: e.target.value
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Channel</Label>
                                        <Select
                                            options={[
                                                { value: 'email', label: 'Email' },
                                                { value: 'whatsapp', label: 'WhatsApp' },
                                                { value: 'sms', label: 'SMS' }
                                            ]}
                                            value={templateForm.channel}
                                            onChange={(e) =>
                                                setTemplateForm({
                                                    ...templateForm,
                                                    channel: e.target.value
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Status</Label>
                                    <Select
                                        options={[
                                            { value: 'active', label: 'Active' },
                                            { value: 'draft', label: 'Draft' }
                                        ]}
                                        value={templateForm.status}
                                        onChange={(e) =>
                                            setTemplateForm({
                                                ...templateForm,
                                                status: e.target.value
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </DrawerSection>

                        <DrawerDivider />

                        <DrawerSection title="Content">
                            <div className="space-y-4">
                                {templateForm.channel === 'email' && (
                                    <div className="space-y-1.5">
                                        <Label>Subject Line</Label>
                                        <Input
                                            placeholder="Enter subject..."
                                            value={templateForm.subject}
                                            onChange={(e) =>
                                                setTemplateForm({
                                                    ...templateForm,
                                                    subject: e.target.value
                                                })
                                            }
                                        />
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label>Message Body</Label>
                                        <span className="text-xs text-muted-foreground">
                                            Supports variables
                                        </span>
                                    </div>
                                    <Textarea
                                        placeholder="Type your message template..."
                                        rows={8}
                                        className="resize-none font-mono text-sm"
                                        value={templateForm.body}
                                        onChange={(e) =>
                                            setTemplateForm({
                                                ...templateForm,
                                                body: e.target.value
                                            })
                                        }
                                    />
                                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-xs text-muted-foreground space-y-1">
                                        <p className="font-medium text-foreground">
                                            Available Variables:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <code className="bg-muted px-1 py-0.5 rounded">
                                                {'{{student_name}}'}
                                            </code>
                                            <code className="bg-muted px-1 py-0.5 rounded">
                                                {'{{cohort_name}}'}
                                            </code>
                                            <code className="bg-muted px-1 py-0.5 rounded">
                                                {'{{mentor_name}}'}
                                            </code>
                                            <code className="bg-muted px-1 py-0.5 rounded">
                                                {'{{amount}}'}
                                            </code>
                                            <code className="bg-muted px-1 py-0.5 rounded">
                                                {'{{due_date}}'}
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </DrawerSection>
                    </div>
                </Drawer>
            </div>
        </DashboardLayout>
    );
}
