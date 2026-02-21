import prisma from '@/lib/prisma';
import type { SyllabusBuilderPermissions } from '@/types/syllabus';

export async function isStudentEnrolledInCourse(userId: string, courseId: string): Promise<boolean> {
    const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
        select: { id: true },
    });

    return Boolean(enrollment);
}

export async function isMentorAssignedToCohort(userId: string, cohortId: string): Promise<boolean> {
    const mentor = await prisma.mentorProfile.findFirst({
        where: {
            userId,
            cohorts: { some: { id: cohortId } },
        },
        select: { id: true },
    });

    return Boolean(mentor);
}

export async function isStudentInCohort(userId: string, cohortId: string): Promise<boolean> {
    const student = await prisma.studentProfile.findUnique({
        where: { userId },
        select: { cohortId: true },
    });

    return student?.cohortId === cohortId;
}

export async function isStudentInCourseScope(studentUserId: string, courseId: string): Promise<boolean> {
    const student = await prisma.studentProfile.findUnique({
        where: { userId: studentUserId },
        select: { cohortId: true },
    });

    if (!student?.cohortId) return false;

    return isCourseInCohort(student.cohortId, courseId);
}

export async function isCourseInCohort(cohortId: string, courseId: string): Promise<boolean> {
    const cohortCourse = await prisma.cohortCourse.findUnique({
        where: {
            cohortId_courseId: {
                cohortId,
                courseId,
            },
        },
        select: { id: true },
    });
    if (cohortCourse) return true;

    const cohort = await prisma.cohort.findUnique({
        where: { id: cohortId },
        select: {
            program: {
                select: { courseId: true },
            },
        },
    });

    return cohort?.program.courseId === courseId;
}

export async function canInstructorAccessCourse(userId: string, courseId: string): Promise<boolean> {
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { createdBy: true },
    });
    if (!course) return false;

    if (course.createdBy === userId) return true;

    const viaCohortCourse = await prisma.cohortCourse.findFirst({
        where: {
            courseId,
            cohort: {
                mentors: { some: { userId } },
            },
        },
        select: { id: true },
    });
    if (viaCohortCourse) return true;

    const viaProgramCourse = await prisma.cohort.findFirst({
        where: {
            mentors: { some: { userId } },
            program: { courseId },
        },
        select: { id: true },
    });

    return Boolean(viaProgramCourse);
}

export async function getSyllabusBuilderPermissions(
    userId: string,
    role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN',
    courseId: string
): Promise<SyllabusBuilderPermissions> {
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
            id: true,
            program: { select: { id: true } },
        },
    });

    if (!course) {
        return {
            canAccess: false,
            canEditLive: false,
            canEditDraft: false,
            canApprove: false,
            role: 'NONE',
            reason: 'Course not found',
        };
    }

    if (!course.program) {
        return {
            canAccess: false,
            canEditLive: false,
            canEditDraft: false,
            canApprove: false,
            role: 'NONE',
            reason: 'Only program-linked syllabus courses can be edited here',
        };
    }

    if (role === 'ADMIN') {
        return {
            canAccess: true,
            canEditLive: true,
            canEditDraft: true,
            canApprove: true,
            role: 'ADMIN',
        };
    }

    if (role !== 'INSTRUCTOR') {
        return {
            canAccess: false,
            canEditLive: false,
            canEditDraft: false,
            canApprove: false,
            role: 'NONE',
            reason: 'Students cannot access syllabus builder',
        };
    }

    const canAccess = await canInstructorAccessCourse(userId, courseId);
    if (!canAccess) {
        return {
            canAccess: false,
            canEditLive: false,
            canEditDraft: false,
            canApprove: false,
            role: 'NONE',
            reason: 'You are not assigned to this syllabus',
        };
    }

    return {
        canAccess: true,
        canEditLive: false,
        canEditDraft: true,
        canApprove: false,
        role: 'MENTOR',
    };
}

export async function canInstructorAccessAssignment(
    userId: string,
    assignmentId: string
): Promise<{ exists: boolean; allowed: boolean; courseId: string | null }> {
    const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        select: { courseId: true },
    });
    if (!assignment) {
        return { exists: false, allowed: false, courseId: null };
    }

    const allowed = await canInstructorAccessCourse(userId, assignment.courseId);
    return { exists: true, allowed, courseId: assignment.courseId };
}

export async function canInstructorAccessQuiz(
    userId: string,
    quizId: string
): Promise<{ exists: boolean; allowed: boolean; courseId: string | null; cohortId: string | null }> {
    const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        select: {
            courseId: true,
            cohortId: true,
            course: { select: { createdBy: true } },
        },
    });
    if (!quiz) {
        return { exists: false, allowed: false, courseId: null, cohortId: null };
    }

    if (quiz.course.createdBy === userId) {
        return { exists: true, allowed: true, courseId: quiz.courseId, cohortId: quiz.cohortId };
    }

    const assigned = await isMentorAssignedToCohort(userId, quiz.cohortId);
    return { exists: true, allowed: assigned, courseId: quiz.courseId, cohortId: quiz.cohortId };
}
