import { z } from 'zod';

export const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128)
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
        .string()
        .min(1, 'New password is required')
        .max(128),
});

export const updateProfileSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    avatarUrl: z.string().url().optional().nullable(),
});

export const courseSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().max(5000).optional(),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
});

export const courseUpdateSchema = courseSchema.partial();

export const moduleSchema = z.object({
    title: z.string().min(2, 'Title must be at least 2 characters').max(200),
    position: z.number().int().min(0).optional(),
});

export const moduleUpdateSchema = moduleSchema.partial();

export const lessonSchema = z.object({
    title: z.string().min(2, 'Title must be at least 2 characters').max(200),
    contentType: z.enum(['TEXT', 'VIDEO', 'FILE']),
    contentBody: z.string().max(50000).optional(),
    position: z.number().int().min(0).optional(),
});

export const lessonUpdateSchema = lessonSchema.partial();

export const assignmentSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().max(5000).optional(),
    moduleId: z.string().optional().nullable(),
    dueAt: z.string().datetime().optional().nullable(),
    maxScore: z.number().int().min(1).max(1000).optional(),
    isPublished: z.boolean().optional(),
});

export const assignmentUpdateSchema = assignmentSchema.partial();

export const gradeSchema = z.object({
    score: z.number().int().min(0),
    feedback: z.string().max(5000).optional(),
});

export const roleUpdateSchema = z.object({
    role: z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN']),
});

export const activeUpdateSchema = z.object({
    isActive: z.boolean(),
});

// Program Schemas
export const programSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(200),
    description: z.string().max(2000).optional(),
    duration: z.string().max(100).optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
});
export const programUpdateSchema = programSchema.partial();

// Cohort Schemas
export const cohortSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(200),
    programId: z.string().cuid('Invalid Program ID'),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional().nullable(),
    status: z.enum(['UPCOMING', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
    capacity: z.number().int().min(1).optional(),
    price: z.number().min(0).optional(),
    currency: z.string().length(3).optional(),
    description: z.string().max(2000).optional().nullable(),
    enrollmentDeadline: z.string().datetime().optional().nullable(),
});
export const cohortUpdateSchema = cohortSchema.partial();

// Mentor Profile Schemas
export const mentorProfileSchema = z.object({
    specialization: z.string().max(200).optional(),
    bio: z.string().max(2000).optional(),
    maxCohorts: z.number().int().min(0).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
    availabilityStatus: z.enum(['AVAILABLE', 'LIMITED', 'UNAVAILABLE']).optional(),
    cohortIds: z.array(z.string()).optional(),
});
export const mentorProfileUpdateSchema = mentorProfileSchema.partial();

// Student Profile Schemas
export const studentProfileSchema = z.object({
    cohortId: z.string().cuid('Invalid Cohort ID').optional().nullable(),
    mentorId: z.string().cuid('Invalid Mentor ID').optional().nullable(),
    phone: z.string().max(20).optional(),
    whatsappOptIn: z.boolean().optional(),
    status: z.enum(['INVITED', 'ACTIVE', 'FLAGGED', 'DROPPED', 'COMPLETED']).optional(),
});
export const studentProfileUpdateSchema = studentProfileSchema.partial();

// Message Schemas
export const messageSchema = z.object({
    subject: z.string().min(1, 'Subject is required').max(200),
    body: z.string().min(1, 'Body is required'),
    channel: z.enum(['EMAIL', 'WHATSAPP', 'SMS']),
    recipientType: z.enum(['INDIVIDUAL', 'COHORT', 'ALL_STUDENTS', 'ALL_MENTORS', 'CUSTOM']),
    recipientIds: z.array(z.string()).optional(), // specific for custom recipients
    scheduledAt: z.string().datetime().optional(),
});

// Settings Schemas
const billingSettingsSchema = z
    .object({
        country: z.string().min(2).max(4).optional(),
        timezone: z.string().min(2).max(100).optional(),
    })
    .catchall(z.union([z.string(), z.number(), z.boolean(), z.null()]));

const securitySettingsSchema = z.object({
    whatsappEnabled: z.boolean().optional(),
    emailEnabled: z.boolean().optional(),
    smsEnabled: z.boolean().optional(),
    pushEnabled: z.boolean().optional(),
    minPasswordLength: z.number().int().min(6).max(32).optional(),
    requireUppercase: z.boolean().optional(),
    requireNumbers: z.boolean().optional(),
    requireSpecialChars: z.boolean().optional(),
    sessionTimeout: z.enum(['15m', '30m', '1h', '4h', '24h']).optional(),
    maxLoginAttempts: z.number().int().min(3).max(10).optional(),
    lockoutMinutes: z.number().int().min(5).max(120).optional(),
}).strict();

const catalogSettingsSchema = z.object({
    mentorSpecialties: z.array(
        z.object({
            value: z.string().min(1).max(100),
            label: z.string().min(1).max(100),
        }).strict()
    ).optional(),
}).strict();

const integrationSettingsSchema = z.object({
    zoomEnabled: z.boolean().optional(),
    zoomApiKey: z.string().max(300).optional(),
    zoomApiSecret: z.string().max(300).optional(),
    meetEnabled: z.boolean().optional(),
    meetClientId: z.string().max(300).optional(),
    whatsappBizEnabled: z.boolean().optional(),
    whatsappBizPhone: z.string().max(50).optional(),
    whatsappBizToken: z.string().max(500).optional(),
    webhookUrl: z.union([z.string().url().max(500), z.literal('')]).optional(),
    webhookEnabled: z.boolean().optional(),
}).strict();

export const settingsSchema = z.object({
    orgName: z.string().min(2).max(100).optional(),
    orgSlug: z.string().min(2).max(50).optional(),
    supportEmail: z.string().email().optional().nullable(),
    primaryColor: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i).optional().nullable(),
    billingSettings: billingSettingsSchema.optional(),
    securitySettings: securitySettingsSchema.optional(),
    catalogSettings: catalogSettingsSchema.optional(),
    integrationSettings: integrationSettingsSchema.optional(),
});

// Subscription Schemas
export const subscriptionUpdateSchema = z.object({
    plan: z.enum(['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE']).optional(),
    billingCycle: z.enum(['MONTHLY', 'YEARLY']).optional(),
    currency: z.string().min(2).max(5).optional(),
});

// Helper to extract Zod errors into a friendly format
export function formatZodErrors(error: z.ZodError) {
    return error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
    }));
}
