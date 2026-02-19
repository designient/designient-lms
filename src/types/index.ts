export interface Program {
    id: string;
    name: string;
    description: string;
    duration: string;
    status: 'Active' | 'Draft' | 'Archived';
    cohortCount: number;
    createdAt: string;
    courseId?: string | null;
    course?: {
        id: string;
        title: string;
        isPublished: boolean;
        _count: { modules: number; enrollments: number };
    } | null;
}

export interface StudentNote {
    id: string;
    authorId: string;
    authorName: string;
    authorRole: 'Mentor' | 'Admin';
    content: string;
    createdAt: string;
}

export interface Student {
    id: string;
    name: string;
    email: string;
    phone?: string;
    alternatePhone?: string;
    whatsappOptIn?: boolean;
    cohortId: string;
    cohortName: string;
    status: 'Invited' | 'Active' | 'Flagged' | 'Dropped' | 'Completed';
    mentor: string | null;
    mentorId: string | null;
    lastActivity: string;
    enrollmentDate: string;
    progress: number;
    sessionsAttended: number;
    totalSessions: number;
    paymentStatus: 'Paid' | 'Pending' | 'Overdue' | 'Refunded';
    notes: StudentNote[];
    flagReason?: string;
}

export interface AssignedCohort {
    id: string;
    name: string;
    status: 'Active' | 'Upcoming' | 'Completed' | 'Archived';
}

export interface Mentor {
    id: string;
    name: string;
    email: string;
    phone?: string;
    whatsappOptIn?: boolean;
    status: 'Active' | 'Inactive';
    assignedCohorts: AssignedCohort[];
    lastActive: string;
    joinDate: string;
    specialty: string;
    bio?: string;
    maxCohorts: number;
    rating: number;
    totalReviews: number;
    totalStudentsMentored: number;
    availabilityStatus: 'Available' | 'Limited' | 'Unavailable';
}

export interface Cohort {
    id: string;
    name: string;
    programId: string;
    programName: string;
    startDate: string;
    endDate: string;
    mentors: string[];
    mentorIds: string[];
    studentCount: number;
    status: 'Active' | 'Upcoming' | 'Completed' | 'Archived';
    description?: string;
    capacity: number;
    enrollmentDeadline: string;
    price: number;
    currency: string;
}

export interface BillingSettings {
    gstNumber: string;
    businessPan: string;
    businessName: string;
    autoGenerateInvoices: boolean;
}

export interface PaymentSettings {
    primaryGateway: 'razorpay' | 'stripe' | 'payu' | 'cashfree';
    enableUpi: boolean;
    enableInternationalCards: boolean;
}

export interface AcademicSettings {
    academicYearFormat: 'apr-mar' | 'sep-aug' | 'jan-dec';
}

export interface CommunicationSettings {
    whatsappEnabled: boolean;
    smsEnabled: boolean;
    emailEnabled: boolean;
    defaultChannel: 'whatsapp' | 'email' | 'sms';
}

export interface Organization {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    primaryColor?: string;
    domain?: string;
    plan: 'trial' | 'starter' | 'growth' | 'enterprise';
    status: 'active' | 'suspended' | 'cancelled';
    createdAt: string;
    studentLimit: number;
    mentorLimit: number;
    cohortLimit: number;
}

export type UserRole =
    'super_admin' |
    'institute_admin' |
    'program_manager' |
    'mentor' |
    'finance_admin' |
    'viewer';

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: 'active' | 'invited' | 'suspended';
    lastActive?: string;
    invitedAt?: string;
}

export interface RolePermission {
    role: UserRole;
    label: string;
    description: string;
    permissions: string[];
}

export interface Subscription {
    plan: 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';
    status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
    billingCycle: 'MONTHLY' | 'YEARLY';
    price: number;
    currency: string;
    overageRate: number;
    studentLimit: number;
    mentorLimit: number;
    cohortLimit: number;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    usage: {
        students: number;
        mentors: number;
        cohorts: number;
    };
    overage: {
        count: number;
        monthlyCost: number;
    };
}

export interface AnalyticsMetric {
    label: string;
    value: number;
    previousValue?: number;
    change?: number;
    changeType?: 'increase' | 'decrease' | 'neutral';
}

export interface CohortAnalytics {
    cohortId: string;
    cohortName: string;
    completionRate: number;
    averageProgress: number;
    dropoutRate: number;
    averageRating: number;
    totalStudents: number;
}

export interface MentorAnalytics {
    mentorId: string;
    mentorName: string;
    rating: number;
    totalSessions: number;
    completedSessions: number;
    studentsSatisfaction: number;
    activeStudents: number;
}

export interface RevenueData {
    month: string;
    revenue: number;
    collections: number;
    pending: number;
}

export interface Session {
    id: string;
    studentId: string;
    studentName: string;
    mentorId: string;
    mentorName: string;
    cohortId: string;
    cohortName: string;
    scheduledAt: string;
    duration: number;
    status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
    meetingLink?: string;
    notes?: string;
    rating?: number;
    feedback?: string;
}

export interface Assignment {
    id: string;
    title: string;
    description: string;
    cohortId: string;
    cohortName: string;
    dueDate: string;
    status: 'draft' | 'published' | 'closed';
    totalSubmissions: number;
    totalStudents: number;
    createdAt: string;
}

export interface Submission {
    id: string;
    assignmentId: string;
    studentId: string;
    studentName: string;
    submittedAt: string;
    status: 'pending' | 'reviewed' | 'approved' | 'needs_revision';
    grade?: string;
    feedback?: string;
    fileUrl?: string;
}

export interface CertificateTemplate {
    id: string;
    name: string;
    programId: string;
    programName: string;
    design: 'classic' | 'modern' | 'minimal';
    status: 'active' | 'draft';
    issuedCount: number;
}

export interface Certificate {
    id: string;
    templateId: string;
    studentId: string;
    studentName: string;
    cohortId: string;
    cohortName: string;
    issuedAt: string;
    certificateNumber: string;
    verificationUrl: string;
    status: 'issued' | 'revoked';
}

export interface AuditLogEntry {
    id: string;
    userId: string;
    userName: string;
    userRole: UserRole;
    action: string;
    resource: string;
    resourceId?: string;
    details?: string;
    ipAddress: string;
    userAgent?: string;
    timestamp: string;
    status: 'success' | 'failed';
}

export interface ApiKey {
    id: string;
    name: string;
    key: string;
    permissions: ('read' | 'write' | 'delete')[];
    lastUsed?: string;
    createdAt: string;
    expiresAt?: string;
    status: 'active' | 'revoked';
}

export interface Webhook {
    id: string;
    name: string;
    url: string;
    events: string[];
    secret: string;
    status: 'active' | 'inactive' | 'failing';
    lastTriggered?: string;
    failureCount: number;
    createdAt: string;
}

export interface SecuritySettings {
    twoFactorEnabled: boolean;
    twoFactorMethod?: 'authenticator' | 'sms' | 'email';
    sessionTimeout: number;
    ipWhitelist: string[];
    passwordPolicy: {
        minLength: number;
        requireUppercase: boolean;
        requireNumbers: boolean;
        requireSpecialChars: boolean;
        expiryDays: number;
    };
    loginAttempts: {
        maxAttempts: number;
        lockoutDuration: number;
    };
}

export interface DataExport {
    id: string;
    type: 'students' | 'mentors' | 'cohorts' | 'payments' | 'full_backup';
    format: 'csv' | 'json' | 'xlsx';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    requestedBy: string;
    requestedAt: string;
    completedAt?: string;
    downloadUrl?: string;
    expiresAt?: string;
    fileSize?: string;
}

export interface MessageTemplate {
    id: string;
    name: string;
    category: 'welcome' | 'reminder' | 'notification' | 'payment' | 'session' | 'custom';
    subject: string;
    body: string;
    channel: 'email' | 'whatsapp' | 'sms';
    variables: string[];
    status: 'active' | 'draft';
    usageCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface Message {
    id: string;
    templateId?: string;
    templateName?: string;
    subject: string;
    body: string;
    channel: 'email' | 'whatsapp' | 'sms';
    recipientType: 'individual' | 'cohort' | 'all_students' | 'all_mentors' | 'custom';
    recipientCount: number;
    recipients: string[];
    sentBy: string;
    sentByName: string;
    sentAt: string;
    status: 'sent' | 'delivered' | 'failed' | 'partial';
    deliveredCount: number;
    failedCount: number;
    openRate?: number;
}

export interface ScheduledMessage {
    id: string;
    templateId?: string;
    templateName?: string;
    subject: string;
    body: string;
    channel: 'email' | 'whatsapp' | 'sms';
    recipientType: 'individual' | 'cohort' | 'all_students' | 'all_mentors' | 'custom';
    recipientCount: number;
    scheduledFor: string;
    scheduledBy: string;
    scheduledByName: string;
    status: 'scheduled' | 'sent' | 'cancelled';
    createdAt: string;
}

export interface CommunicationStats {
    totalSent: number;
    deliveryRate: number;
    openRate: number;
    channelBreakdown: {
        email: number;
        whatsapp: number;
        sms: number;
    };
}

export type PageName =
    | 'dashboard'
    | 'analytics'
    | 'cohorts'
    | 'programs'
    | 'students'
    | 'mentors'
    | 'communications'
    | 'settings';

export type SettingsTab =
    | 'organization'
    | 'team'
    | 'roles'
    | 'billing'
    | 'security'
    | 'api'
    | 'data';
