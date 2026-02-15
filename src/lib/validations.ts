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

// Helper to extract Zod errors into a friendly format
export function formatZodErrors(error: z.ZodError) {
    return error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
    }));
}
