import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PageName } from '../components/layout/Sidebar';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from
  '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import {
  Save,
  Users,
  Shield,
  Mail,
  Building2,
  CreditCard as BillingIcon,
  CreditCard,
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
  Eye,
  EyeOff,
  Copy,
  Plus,
  Trash2,
  Clock,
  Globe,
  Download,
  AlertTriangle,
  Smartphone,
  Lock,
  MessageSquare
} from
  'lucide-react';
import {
  TeamMember,
  Subscription,
  AuditLogEntry,
  ApiKey,
  Webhook as WebhookType,
  DataExport,
  UserRole
} from
  '../types';
export type SettingsTab =
  'organization' |
  'branding' |
  'team' |
  'subscription' |
  'billing' |
  'notifications' |
  'security' |
  'integrations' |
  'audit' |
  'data';
interface SettingsPageProps {
  currentPage: PageName;
  onNavigate: (page: PageName) => void;
  initialTab?: SettingsTab;
  onBillingClick?: () => void;
  onSelectEntity?: (type: 'student' | 'mentor' | 'cohort', id: string) => void;
}
// Mock Data
const initialTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Super Admin',
    email: 'admin@designient.com',
    role: 'institute_admin',
    status: 'active',
    lastActive: 'Just now'
  },
  {
    id: '2',
    name: 'Priya Sharma',
    email: 'priya@designient.com',
    role: 'program_manager',
    status: 'active',
    lastActive: '2 hours ago'
  },
  {
    id: '3',
    name: 'Rahul Verma',
    email: 'rahul@designient.com',
    role: 'finance_admin',
    status: 'invited',
    invitedAt: '2 days ago'
  }];

const mockSubscription: Subscription = {
  plan: 'growth',
  status: 'active',
  currentPeriodEnd: 'April 15, 2024',
  studentCount: 186,
  studentLimit: 500,
  mentorCount: 8,
  mentorLimit: 20,
  cohortCount: 8,
  cohortLimit: 25,
  price: 24999,
  currency: 'INR',
  billingCycle: 'monthly'
};
const mockAuditLogs: AuditLogEntry[] = [
  {
    id: 'AL-001',
    userId: 'U-001',
    userName: 'Super Admin',
    userRole: 'institute_admin',
    action: 'student.status.updated',
    resource: 'Student',
    resourceId: 'S-1002',
    details: 'Changed status from Active to Flagged',
    ipAddress: '103.21.244.12',
    timestamp: '2024-03-15 14:32:18',
    status: 'success'
  },
  {
    id: 'AL-002',
    userId: 'U-002',
    userName: 'Priya Sharma',
    userRole: 'program_manager',
    action: 'cohort.created',
    resource: 'Cohort',
    resourceId: 'C-2024-005',
    details: 'Created new cohort: Summer 2024 Advanced UI',
    ipAddress: '103.21.244.15',
    timestamp: '2024-03-15 12:15:42',
    status: 'success'
  },
  {
    id: 'AL-003',
    userId: 'U-001',
    userName: 'Super Admin',
    userRole: 'institute_admin',
    action: 'settings.billing.updated',
    resource: 'Settings',
    details: 'Updated payment gateway to Razorpay',
    ipAddress: '103.21.244.12',
    timestamp: '2024-03-15 10:08:33',
    status: 'success'
  }];

const initialApiKeys: ApiKey[] = [
  {
    id: 'KEY-001',
    name: 'Production API',
    key: 'sk_live_****************************1a2b',
    permissions: ['read', 'write'],
    lastUsed: '2 hours ago',
    createdAt: 'Jan 15, 2024',
    status: 'active'
  },
  {
    id: 'KEY-002',
    name: 'Webhook Integration',
    key: 'sk_live_****************************3c4d',
    permissions: ['read'],
    lastUsed: '1 day ago',
    createdAt: 'Feb 20, 2024',
    status: 'active'
  }];

const initialWebhooks: WebhookType[] = [
  {
    id: 'WH-001',
    name: 'Slack Notifications',
    url: 'https://hooks.slack.com/services/T00/B00/xxxx',
    events: ['student.enrolled', 'student.flagged', 'payment.received'],
    secret: 'whsec_****************************',
    status: 'active',
    lastTriggered: '30 minutes ago',
    failureCount: 0,
    createdAt: 'Jan 10, 2024'
  },
  {
    id: 'WH-002',
    name: 'CRM Sync',
    url: 'https://api.crm.example.com/webhooks',
    events: ['student.enrolled', 'student.completed'],
    secret: 'whsec_****************************',
    status: 'failing',
    lastTriggered: '2 days ago',
    failureCount: 5,
    createdAt: 'Feb 5, 2024'
  }];

const initialExports: DataExport[] = [
  {
    id: 'EXP-001',
    type: 'students',
    format: 'csv',
    status: 'completed',
    requestedBy: 'Super Admin',
    requestedAt: 'Mar 15, 2024 10:30 AM',
    completedAt: 'Mar 15, 2024 10:32 AM',
    downloadUrl: '#',
    expiresAt: 'Mar 22, 2024',
    fileSize: '2.4 MB'
  },
  {
    id: 'EXP-002',
    type: 'payments',
    format: 'xlsx',
    status: 'processing',
    requestedBy: 'Rahul Verma',
    requestedAt: 'Mar 15, 2024 14:15 PM'
  }];

const roleOptions = [
  {
    value: 'program_manager',
    label: 'Program Manager'
  },
  {
    value: 'finance_admin',
    label: 'Finance Admin'
  },
  {
    value: 'mentor',
    label: 'Mentor'
  },
  {
    value: 'viewer',
    label: 'Viewer (Read-only)'
  }];

export function SettingsPage({
  currentPage,
  onNavigate,
  initialTab = 'organization',
  onBillingClick,
  onSelectEntity
}: SettingsPageProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  // Update active tab if initialTab changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  // Data states
  const [teamMembers, setTeamMembers] =
    useState<TeamMember[]>(initialTeamMembers);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys);
  const [webhooks, setWebhooks] = useState<WebhookType[]>(initialWebhooks);
  const [exports, setExports] = useState<DataExport[]>(initialExports);
  // Modal/Drawer states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [showRemoveMemberConfirm, setShowRemoveMemberConfirm] = useState<
    string | null>(
      null);
  const [showCreateApiKeyModal, setShowCreateApiKeyModal] = useState(false);
  const [showDeleteApiKeyConfirm, setShowDeleteApiKeyConfirm] = useState<
    string | null>(
      null);
  // Form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('program_manager');
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [newApiKeyPermissions, setNewApiKeyPermissions] = useState<string[]>([
    'read']
  );
  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: 'Settings Saved',
        description: 'Your changes have been saved successfully.',
        variant: 'success'
      });
    }, 1000);
  };
  const handleInviteMember = () => {
    if (!inviteEmail.trim()) return;
    if (editingMemberId) {
      // Update existing member
      setTeamMembers((prev) =>
        prev.map((m) =>
          m.id === editingMemberId ?
            {
              ...m,
              email: inviteEmail,
              role: inviteRole
            } :
            m
        )
      );
      toast({
        title: 'Member Updated',
        description: `Role updated for ${inviteEmail}`,
        variant: 'success'
      });
    } else {
      // Create new member
      const newMember: TeamMember = {
        id: String(teamMembers.length + 1),
        name: inviteEmail.
          split('@')[0].
          split('.').
          map((w) => w.charAt(0).toUpperCase() + w.slice(1)).
          join(' '),
        email: inviteEmail,
        role: inviteRole,
        status: 'invited',
        invitedAt: 'Just now'
      };
      setTeamMembers((prev) => [...prev, newMember]);
      toast({
        title: 'Invitation Sent',
        description: `Invitation sent to ${inviteEmail}`,
        variant: 'success'
      });
    }
    setShowInviteModal(false);
    setEditingMemberId(null);
    setInviteEmail('');
    setInviteRole('program_manager');
  };
  const handleRemoveMember = (memberId: string) => {
    const member = teamMembers.find((m) => m.id === memberId);
    setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
    toast({
      title: 'Member Removed',
      description: `${member?.name} has been removed from the team.`,
      variant: 'success'
    });
    setShowRemoveMemberConfirm(null);
  };
  const handleEditMember = (memberId: string) => {
    const member = teamMembers.find((m) => m.id === memberId);
    if (member) {
      setEditingMemberId(memberId);
      setInviteEmail(member.email);
      setInviteRole(member.role);
      setShowInviteModal(true);
    }
  };
  const handleResendInvite = (memberId: string) => {
    const member = teamMembers.find((m) => m.id === memberId);
    toast({
      title: 'Invitation Resent',
      description: `Invitation resent to ${member?.email}`,
      variant: 'success'
    });
  };
  const handleCreateApiKey = () => {
    if (!newApiKeyName.trim()) return;
    const newKey: ApiKey = {
      id: `KEY-${String(apiKeys.length + 1).padStart(3, '0')}`,
      name: newApiKeyName,
      key: `sk_live_${Math.random().toString(36).substring(2, 15)}****${Math.random().toString(36).substring(2, 6)}`,
      permissions: newApiKeyPermissions as ('read' | 'write' | 'delete')[],
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      status: 'active'
    };
    setApiKeys((prev) => [...prev, newKey]);
    toast({
      title: 'API Key Created',
      description: `"${newApiKeyName}" has been created. Make sure to copy it now.`,
      variant: 'success'
    });
    setShowCreateApiKeyModal(false);
    setNewApiKeyName('');
    setNewApiKeyPermissions(['read']);
  };
  const handleDeleteApiKey = (keyId: string) => {
    const key = apiKeys.find((k) => k.id === keyId);
    setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
    toast({
      title: 'API Key Deleted',
      description: `"${key?.name}" has been revoked.`,
      variant: 'success'
    });
    setShowDeleteApiKeyConfirm(null);
  };
  const handleCopyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: 'Copied',
      description: 'API key copied to clipboard.',
      variant: 'info'
    });
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
      }];

  return (
    <DashboardLayout
      title="Settings"
      subtitle="Configure platform settings and preferences"
      currentPage={currentPage}
      onNavigate={onNavigate}
      onBillingClick={onBillingClick}
      onSelectEntity={onSelectEntity}>

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
                  className={`group inline-flex items-center py-3 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${isActive ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50 dark:bg-emerald-500/10 dark:text-emerald-400' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>

                  <tab.icon
                    className={`-ml-0.5 mr-1.5 h-4 w-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground group-hover:text-foreground'}`} />

                  {tab.label}
                </button>);

            })}
          </nav>
        </div>

        <div className="max-w-4xl">
          {/* Organization Tab */}
          {activeTab === 'organization' &&
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="orgName">Organization Name</Label>
                      <Input id="orgName" defaultValue="Designient" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="orgSlug">Organization Slug</Label>
                      <div className="flex rounded-md shadow-sm">
                        <Input
                          id="orgSlug"
                          defaultValue="designient"
                          className="rounded-r-none" />

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
                        defaultValue="support@designient.com" />

                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        id="timezone"
                        options={[
                          {
                            value: 'Asia/Kolkata',
                            label: 'India Standard Time (IST)'
                          },
                          {
                            value: 'America/New_York',
                            label: 'Eastern Time (ET)'
                          },
                          {
                            value: 'America/Los_Angeles',
                            label: 'Pacific Time (PT)'
                          }]
                        }
                        defaultValue="Asia/Kolkata" />

                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/20 border-t border-border/50 flex justify-end py-3">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">

                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Organization'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          }

          {/* Branding Tab */}
          {activeTab === 'branding' &&
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
                            className="text-destructive hover:text-destructive">

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
                      <div className="h-10 w-10 rounded-md bg-emerald-600 shadow-sm ring-2 ring-offset-2 ring-offset-background ring-emerald-600/50"></div>
                      <Input
                        className="w-32 font-mono"
                        defaultValue="#059669" />

                      <span className="text-xs text-muted-foreground">
                        Current: Emerald
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/20 border-t border-border/50 flex justify-end py-3">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">

                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Branding'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          }

          {/* Team Tab */}
          {activeTab === 'team' &&
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
                          Manage who has access to your dashboard.
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => setShowInviteModal(true)}>

                      <Mail className="h-3.5 w-3.5" />
                      Invite Member
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {teamMembers.map((member) =>
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">

                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm">
                            {member.name.
                              split(' ').
                              map((n) => n[0]).
                              join('')}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">
                                {member.name}
                              </p>
                              <Badge
                                variant={
                                  member.status === 'active' ?
                                    'success' :
                                    'neutral'
                                }
                                className="text-[10px] px-1.5 py-0">

                                {member.status === 'active' ?
                                  'Active' :
                                  'Invited'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {member.email} •{' '}
                              {member.role.
                                split('_').
                                map(
                                  (w) => w.charAt(0).toUpperCase() + w.slice(1)
                                ).
                                join(' ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.role === 'institute_admin' ?
                            <span className="text-xs text-muted-foreground px-3">
                              Owner
                            </span> :
                            showRemoveMemberConfirm === member.id ?
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => setShowRemoveMemberConfirm(null)}>

                                  Cancel
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleRemoveMember(member.id)}>

                                  Confirm
                                </Button>
                              </div> :

                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() =>
                                    member.status === 'invited' ?
                                      handleResendInvite(member.id) :
                                      handleEditMember(member.id)
                                  }>

                                  {member.status === 'invited' ?
                                    'Resend' :
                                    'Edit'}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() =>
                                    setShowRemoveMemberConfirm(member.id)
                                  }>

                                  Remove
                                </Button>
                              </>
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          }

          {/* Subscription Tab */}
          {activeTab === 'subscription' &&
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
                          {mockSubscription.plan.toUpperCase()} PLAN
                        </h3>
                        <Badge variant="success" className="text-[10px]">
                          Active
                        </Badge>
                      </div>
                      <span className="font-semibold text-foreground">
                        ₹{mockSubscription.price.toLocaleString()}/month
                      </span>
                    </div>
                    <div className="h-px bg-emerald-200 w-full my-3"></div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Renews on {mockSubscription.currentPeriodEnd}
                      </span>
                      <Button variant="outline" size="sm" className="h-7">
                        Manage Plan
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Usage This Month</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            Students
                          </span>
                          <span className="font-medium">
                            {mockSubscription.studentCount} /{' '}
                            {mockSubscription.studentLimit}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{
                              width: `${mockSubscription.studentCount / mockSubscription.studentLimit * 100}%`
                            }}>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Mentors</span>
                          <span className="font-medium">
                            {mockSubscription.mentorCount} /{' '}
                            {mockSubscription.mentorLimit}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{
                              width: `${mockSubscription.mentorCount / mockSubscription.mentorLimit * 100}%`
                            }}>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            Active Cohorts
                          </span>
                          <span className="font-medium">
                            {mockSubscription.cohortCount} /{' '}
                            {mockSubscription.cohortLimit}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{
                              width: `${mockSubscription.cohortCount / mockSubscription.cohortLimit * 100}%`
                            }}>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          }

          {/* Billing Tab */}
          {activeTab === 'billing' &&
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
                        Configure GST and business details for invoicing.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="gstNumber">GST Number (GSTIN)</Label>
                      <Input
                        id="gstNumber"
                        placeholder="22AAAAA0000A1Z5"
                        defaultValue="27AABCD1234E1Z5" />

                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="businessPan">Business PAN</Label>
                      <Input
                        id="businessPan"
                        placeholder="AAAAA0000A"
                        defaultValue="AABCD1234E" />

                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="businessName">
                      Registered Business Name
                    </Label>
                    <Input
                      id="businessName"
                      placeholder="Your registered business name"
                      defaultValue="Designient Education Pvt. Ltd." />

                  </div>
                </CardContent>
                <CardFooter className="bg-muted/20 border-t border-border/50 flex justify-end py-3">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">

                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Billing Info'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          }

          {/* Notifications Tab */}
          {activeTab === 'notifications' &&
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
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/20 transition-colors">
                      <input
                        type="checkbox"
                        id="whatsappNotif"
                        className="mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        defaultChecked />

                      <div>
                        <label
                          htmlFor="whatsappNotif"
                          className="text-sm font-medium text-foreground block">

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
                        defaultChecked />

                      <div>
                        <label
                          htmlFor="emailNotif"
                          className="text-sm font-medium text-foreground block">

                          Email Notifications
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Primary channel for detailed communications.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/20 border-t border-border/50 flex justify-end py-3">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">

                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          }

          {/* Security Tab */}
          {activeTab === 'security' &&
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Card className="bg-white dark:bg-card border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Two-Factor Authentication
                      </CardTitle>
                      <CardDescription>
                        Add an extra layer of security to your account.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-emerald-200 bg-emerald-50/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Authenticator App</p>
                        <p className="text-xs text-muted-foreground">
                          Use Google Authenticator or similar apps
                        </p>
                      </div>
                    </div>
                    <Badge variant="success">Enabled</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Email OTP</p>
                        <p className="text-xs text-muted-foreground">
                          Receive codes via email
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          }

          {/* Integrations Tab */}
          {activeTab === 'integrations' &&
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Card className="bg-white dark:bg-card border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          API Keys
                        </CardTitle>
                        <CardDescription>
                          Manage API keys for external integrations.
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => setShowCreateApiKeyModal(true)}>

                      <Plus className="h-3.5 w-3.5" />
                      Create Key
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {apiKeys.map((apiKey) =>
                      <div
                        key={apiKey.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">

                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Key className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">
                                {apiKey.name}
                              </p>
                              <Badge
                                variant={
                                  apiKey.status === 'active' ?
                                    'success' :
                                    'destructive'
                                }
                                className="text-[10px]">

                                {apiKey.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <code className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                {showApiKey === apiKey.id ?
                                  'sk_live_************************' :
                                  apiKey.key}
                              </code>
                              <button
                                onClick={() =>
                                  setShowApiKey(
                                    showApiKey === apiKey.id ? null : apiKey.id
                                  )
                                }
                                className="text-muted-foreground hover:text-foreground">

                                {showApiKey === apiKey.id ?
                                  <EyeOff className="h-3.5 w-3.5" /> :

                                  <Eye className="h-3.5 w-3.5" />
                                }
                              </button>
                              <button
                                onClick={() => handleCopyApiKey(apiKey.key)}
                                className="text-muted-foreground hover:text-foreground">

                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Last used: {apiKey.lastUsed || 'Never'}
                          </span>
                          {showDeleteApiKeyConfirm === apiKey.id ?
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7"
                                onClick={() => setShowDeleteApiKeyConfirm(null)}>

                                Cancel
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteApiKey(apiKey.id)}>

                                Delete
                              </Button>
                            </div> :

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() =>
                                setShowDeleteApiKeyConfirm(apiKey.id)
                              }>

                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          }

          {/* Audit Log Tab */}
          {activeTab === 'audit' &&
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
                    {mockAuditLogs.map((log) =>
                      <div
                        key={log.id}
                        className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors">

                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${log.status === 'success' ? 'bg-emerald-100' : 'bg-red-100'}`}>

                          {log.status === 'success' ?
                            <Check className="h-4 w-4 text-emerald-600" /> :

                            <X className="h-4 w-4 text-red-600" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">
                              {log.userName}
                            </span>
                            <Badge variant="outline" className="text-[9px]">
                              {log.userRole.
                                split('_').
                                map(
                                  (w) => w.charAt(0).toUpperCase() + w.slice(1)
                                ).
                                join(' ')}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              performed
                            </span>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                              {log.action}
                            </code>
                          </div>
                          {log.details &&
                            <p className="text-xs text-muted-foreground mt-1">
                              {log.details}
                            </p>
                          }
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {log.timestamp}
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {log.ipAddress}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/20 border-t border-border/50 flex justify-center py-3">
                  <Button variant="ghost" size="sm">
                    Load More
                  </Button>
                </CardFooter>
              </Card>
            </div>
          }

          {/* Data Tab */}
          {activeTab === 'data' &&
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Card className="bg-white dark:bg-card border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Export Data
                      </CardTitle>
                      <CardDescription>
                        Download your data in various formats.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-border/50 hover:border-emerald-300 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Students</p>
                          <p className="text-xs text-muted-foreground">
                            All student records
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          CSV
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          Excel
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          JSON
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border border-border/50 hover:border-emerald-300 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Payments</p>
                          <p className="text-xs text-muted-foreground">
                            Transaction history
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          CSV
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          Excel
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          JSON
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-200 bg-amber-50/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        Data Retention Policy
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Exported files are available for download for 7 days.
                        Full backups are retained for 30 days.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          }
        </div>

        {/* Invite Member Modal */}
        {showInviteModal &&
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => {
                setShowInviteModal(false);
                setEditingMemberId(null);
              }} />

            <div className="relative z-50 w-full max-w-md mx-4 bg-background rounded-xl shadow-xl border border-border/60 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold">
                    {editingMemberId ?
                      'Edit Team Member' :
                      'Invite Team Member'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {editingMemberId ?
                      'Update role and permissions' :
                      'Send an invitation to join your team'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setEditingMemberId(null);
                  }}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors">

                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={!!editingMemberId} />

                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select
                    options={roleOptions}
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)} />

                </div>
              </div>
              <div className="flex gap-3 px-6 py-4 border-t border-border bg-muted/30">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInviteModal(false);
                    setEditingMemberId(null);
                  }}
                  className="flex-1">

                  Cancel
                </Button>
                <Button
                  onClick={handleInviteMember}
                  className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={!inviteEmail.trim()}>

                  <Mail className="h-4 w-4" />
                  {editingMemberId ? 'Save Changes' : 'Send Invitation'}
                </Button>
              </div>
            </div>
          </div>
        }

        {/* Create API Key Modal */}
        {showCreateApiKeyModal &&
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowCreateApiKeyModal(false)} />

            <div className="relative z-50 w-full max-w-md mx-4 bg-background rounded-xl shadow-xl border border-border/60 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold">Create API Key</h2>
                  <p className="text-sm text-muted-foreground">
                    Generate a new API key for integrations
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateApiKeyModal(false)}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors">

                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>Key Name</Label>
                  <Input
                    placeholder="e.g., Production API"
                    value={newApiKeyName}
                    onChange={(e) => setNewApiKeyName(e.target.value)} />

                </div>
                <div className="space-y-1.5">
                  <Label>Permissions</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="perm-read"
                        checked={newApiKeyPermissions.includes('read')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewApiKeyPermissions((prev) => [...prev, 'read']);
                          } else {
                            setNewApiKeyPermissions((prev) =>
                              prev.filter((p) => p !== 'read')
                            );
                          }
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />

                      <label htmlFor="perm-read" className="text-sm">
                        Read (view data)
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="perm-write"
                        checked={newApiKeyPermissions.includes('write')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewApiKeyPermissions((prev) => [
                              ...prev,
                              'write']
                            );
                          } else {
                            setNewApiKeyPermissions((prev) =>
                              prev.filter((p) => p !== 'write')
                            );
                          }
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />

                      <label htmlFor="perm-write" className="text-sm">
                        Write (create/update data)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 px-6 py-4 border-t border-border bg-muted/30">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateApiKeyModal(false)}
                  className="flex-1">

                  Cancel
                </Button>
                <Button
                  onClick={handleCreateApiKey}
                  className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={
                    !newApiKeyName.trim() || newApiKeyPermissions.length === 0
                  }>

                  <Key className="h-4 w-4" />
                  Create Key
                </Button>
              </div>
            </div>
          </div>
        }
      </div>
    </DashboardLayout>);

}