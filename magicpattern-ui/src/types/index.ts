export interface Program {
  id: string;
  name: string;
  description: string;
  duration: string; // e.g., '12 weeks'
  status: 'Active' | 'Draft' | 'Archived';
  cohortCount: number;
  createdAt: string;
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
  alternatePhone?: string; // Parent/Guardian contact
  whatsappOptIn?: boolean; // WhatsApp notifications opt-in
  cohortId: string;
  cohortName: string;
  status: 'Invited' | 'Active' | 'Flagged' | 'Dropped' | 'Completed';
  mentor: string | null;
  mentorId: string | null;
  lastActivity: string;
  enrollmentDate: string;
  progress: number; // 0-100 percentage
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
  whatsappOptIn?: boolean; // WhatsApp notifications opt-in
  status: 'Active' | 'Inactive';
  assignedCohorts: AssignedCohort[];
  lastActive: string;
  joinDate: string;
  specialty: string;
  bio?: string;
  maxCohorts: number;
  rating: number; // 1-5 scale
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
  capacity: number; // max students
  enrollmentDeadline: string;
  price: number;
  currency: string;
}

// Platform Settings Types
export interface BillingSettings {
  gstNumber: string; // GSTIN format: 22AAAAA0000A1Z5
  businessPan: string; // PAN format: AAAAA0000A
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

// Multi-Tenant Types
export interface Organization {
  id: string;
  name: string;
  slug: string; // subdomain: acme.designient.com
  logo?: string;
  primaryColor?: string;
  domain?: string; // custom domain
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
  plan: 'trial' | 'starter' | 'growth' | 'enterprise';
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  currentPeriodEnd: string;
  studentCount: number;
  studentLimit: number;
  mentorCount: number;
  mentorLimit: number;
  cohortCount: number;
  cohortLimit: number;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
}

// Tier 2: Analytics Types
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

// Tier 2: Session Types
export interface Session {
  id: string;
  studentId: string;
  studentName: string;
  mentorId: string;
  mentorName: string;
  cohortId: string;
  cohortName: string;
  scheduledAt: string;
  duration: number; // minutes
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  meetingLink?: string;
  notes?: string;
  rating?: number;
  feedback?: string;
}

// Tier 2: Assignment Types
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

// Tier 2: Certificate Types
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

// Tier 3: Audit & Security Types
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
  key: string; // masked, e.g., "sk_live_****1234"
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
  secret: string; // masked
  status: 'active' | 'inactive' | 'failing';
  lastTriggered?: string;
  failureCount: number;
  createdAt: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'authenticator' | 'sms' | 'email';
  sessionTimeout: number; // minutes
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
    lockoutDuration: number; // minutes
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

// Tier 4: Communication Types
export interface MessageTemplate {
  id: string;
  name: string;
  category:
  'welcome' |
  'reminder' |
  'notification' |
  'payment' |
  'session' |
  'custom';
  subject: string;
  body: string;
  channel: 'email' | 'whatsapp' | 'sms';
  variables: string[]; // e.g., ['{{student_name}}', '{{cohort_name}}']
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
  recipientType:
  'individual' |
  'cohort' |
  'all_students' |
  'all_mentors' |
  'custom';
  recipientCount: number;
  recipients: string[]; // IDs of recipients
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
  recipientType:
  'individual' |
  'cohort' |
  'all_students' |
  'all_mentors' |
  'custom';
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