import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { logAudit } from '@/lib/audit';

// GET /api/v1/students/[id]/notes — list notes for a student
export const GET = withAuth(
    async (req: NextRequest, { params }) => {
        try {
            const { id: studentId } = await params;

            const student = await prisma.studentProfile.findUnique({
                where: { id: studentId },
            });
            if (!student) return apiError('Student not found', 404, 'NOT_FOUND');

            const notes = await prisma.studentNote.findMany({
                where: { studentId },
                include: {
                    author: { select: { id: true, name: true, role: true } },
                },
                orderBy: { createdAt: 'desc' },
            });

            return apiSuccess({
                notes: notes.map(n => ({
                    id: n.id,
                    authorId: n.authorId,
                    authorName: n.author.name,
                    authorRole: n.author.role,
                    content: n.content,
                    createdAt: n.createdAt.toISOString(),
                })),
            });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN', 'INSTRUCTOR']
);

// POST /api/v1/students/[id]/notes — add a note to a student
export const POST = withAuth(
    async (req: NextRequest, { params }, user) => {
        try {
            const { id: studentId } = await params;
            const body = await req.json();

            if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
                return apiError('Note content is required', 400, 'MISSING_FIELD');
            }

            const student = await prisma.studentProfile.findUnique({
                where: { id: studentId },
            });
            if (!student) return apiError('Student not found', 404, 'NOT_FOUND');

            const note = await prisma.studentNote.create({
                data: {
                    studentId,
                    authorId: user.id,
                    content: body.content.trim(),
                },
                include: {
                    author: { select: { id: true, name: true, role: true } },
                },
            });

            await logAudit(user.id, 'NOTE_ADDED', 'StudentNote', note.id, { studentId });

            return apiSuccess({
                id: note.id,
                authorId: note.authorId,
                authorName: note.author.name,
                authorRole: note.author.role,
                content: note.content,
                createdAt: note.createdAt.toISOString(),
            }, 201);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN', 'INSTRUCTOR']
);
