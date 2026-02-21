import prisma from '@/lib/prisma';

export async function getCohortCourseIds(cohortId: string): Promise<string[]> {
    const cohort = await prisma.cohort.findUnique({
        where: { id: cohortId },
        select: {
            courses: { select: { courseId: true } },
            program: { select: { courseId: true } },
        },
    });

    if (!cohort) return [];

    const ids = new Set<string>();
    cohort.courses.forEach((c) => ids.add(c.courseId));
    if (cohort.program.courseId) ids.add(cohort.program.courseId);

    return Array.from(ids);
}

export async function ensureStudentEnrollmentsForCohort(userId: string, cohortId: string): Promise<number> {
    const courseIds = await getCohortCourseIds(cohortId);
    if (courseIds.length === 0) return 0;

    const existing = await prisma.enrollment.findMany({
        where: {
            userId,
            courseId: { in: courseIds },
        },
        select: { courseId: true },
    });
    const existingIds = new Set(existing.map((e) => e.courseId));

    const toCreate = courseIds
        .filter((courseId) => !existingIds.has(courseId))
        .map((courseId) => ({ userId, courseId }));

    if (toCreate.length > 0) {
        await prisma.enrollment.createMany({ data: toCreate });
    }

    return toCreate.length;
}

export async function ensureAllCohortStudentsEnrolled(cohortId: string, courseIds?: string[]): Promise<number> {
    const studentProfiles = await prisma.studentProfile.findMany({
        where: { cohortId },
        select: { userId: true },
    });
    if (studentProfiles.length === 0) return 0;

    const resolvedCourseIds = courseIds && courseIds.length > 0
        ? Array.from(new Set(courseIds))
        : await getCohortCourseIds(cohortId);

    if (resolvedCourseIds.length === 0) return 0;

    const userIds = studentProfiles.map((s) => s.userId);
    const existing = await prisma.enrollment.findMany({
        where: {
            userId: { in: userIds },
            courseId: { in: resolvedCourseIds },
        },
        select: { userId: true, courseId: true },
    });

    const existingPairs = new Set(existing.map((e) => `${e.userId}:${e.courseId}`));
    const toCreate: Array<{ userId: string; courseId: string }> = [];

    for (const userId of userIds) {
        for (const courseId of resolvedCourseIds) {
            const key = `${userId}:${courseId}`;
            if (!existingPairs.has(key)) {
                toCreate.push({ userId, courseId });
            }
        }
    }

    if (toCreate.length > 0) {
        await prisma.enrollment.createMany({ data: toCreate });
    }

    return toCreate.length;
}
