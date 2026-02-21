import { Prisma, ContentType } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import type {
    SyllabusSnapshot,
    SyllabusModule,
    SyllabusLesson,
    SyllabusContentType,
} from '@/types/syllabus';
import { z } from 'zod';

function buildSnapshotSchema(strict: boolean) {
    const moduleTitle = strict
        ? z.string().trim().min(1, 'Module title is required').max(200)
        : z.string().max(200).default('');

    const lessonTitle = strict
        ? z.string().trim().min(1, 'Lesson title is required').max(200)
        : z.string().max(200).default('');

    const lessonSchema = z.object({
        id: z.string().min(1).max(100).optional(),
        title: lessonTitle,
        contentType: z.enum(['TEXT', 'VIDEO', 'FILE']),
        contentBody: z.string().max(50000).nullable().optional(),
        position: z.number().int().min(0).optional(),
    }).superRefine((lesson, ctx) => {
        if (!strict) return;
        if (lesson.contentType === 'VIDEO' || lesson.contentType === 'FILE') {
            const value = (lesson.contentBody || '').trim();
            if (!value) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['contentBody'],
                    message: `${lesson.contentType} lessons require a valid URL`,
                });
                return;
            }
            try {
                void new URL(value);
            } catch {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['contentBody'],
                    message: `${lesson.contentType} lessons require a valid URL`,
                });
            }
        }
    });

    return z.object({
        modules: z.array(
            z.object({
                id: z.string().min(1).max(100).optional(),
                title: moduleTitle,
                position: z.number().int().min(0).optional(),
                lessons: z.array(lessonSchema),
            })
        ),
    });
}

function normalizeLesson(lesson: {
    id?: string;
    title: string;
    contentType: SyllabusContentType;
    contentBody?: string | null;
}, position: number): SyllabusLesson {
    const trimmedBody = (lesson.contentBody || '').trim();
    return {
        id: lesson.id,
        title: lesson.title.trim(),
        contentType: lesson.contentType,
        contentBody: trimmedBody.length > 0 ? trimmedBody : null,
        position,
    };
}

function normalizeModule(moduleInput: {
    id?: string;
    title: string;
    lessons: Array<{
        id?: string;
        title: string;
        contentType: SyllabusContentType;
        contentBody?: string | null;
    }>;
}, position: number): SyllabusModule {
    return {
        id: moduleInput.id,
        title: moduleInput.title.trim(),
        position,
        lessons: moduleInput.lessons.map((lesson, lessonIndex) => normalizeLesson(lesson, lessonIndex)),
    };
}

function parseWithSchema(value: unknown, strict: boolean): SyllabusSnapshot {
    const parsed = buildSnapshotSchema(strict).safeParse(value);
    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message || 'Invalid syllabus snapshot';
        throw new AppError(422, firstError, 'VALIDATION_ERROR');
    }

    return {
        modules: parsed.data.modules.map((moduleItem, moduleIndex) =>
            normalizeModule(moduleItem, moduleIndex)
        ),
    };
}

export function normalizeSyllabusSnapshot(value: unknown): SyllabusSnapshot {
    return parseWithSchema(value, false);
}

export function validateSyllabusSnapshotForSubmit(value: unknown): SyllabusSnapshot {
    return parseWithSchema(value, true);
}

export function snapshotToJson(snapshot: SyllabusSnapshot): Prisma.InputJsonValue {
    return snapshot as unknown as Prisma.InputJsonValue;
}

export function serializeLiveSyllabus(
    modules: Array<{
        id: string;
        title: string;
        position: number;
        lessons: Array<{
            id: string;
            title: string;
            contentType: ContentType;
            contentBody: string | null;
            position: number;
        }>;
    }>
): SyllabusSnapshot {
    const sortedModules = [...modules].sort((a, b) => a.position - b.position);
    return {
        modules: sortedModules.map((moduleItem, moduleIndex) => ({
            id: moduleItem.id,
            title: moduleItem.title,
            position: moduleIndex,
            lessons: [...moduleItem.lessons]
                .sort((a, b) => a.position - b.position)
                .map((lesson, lessonIndex) => ({
                    id: lesson.id,
                    title: lesson.title,
                    contentType: lesson.contentType as SyllabusContentType,
                    contentBody: lesson.contentBody,
                    position: lessonIndex,
                })),
        })),
    };
}

export async function getLiveSyllabusSnapshot(
    courseId: string,
    tx: Prisma.TransactionClient | typeof prisma = prisma
): Promise<SyllabusSnapshot> {
    const modules = await tx.module.findMany({
        where: { courseId },
        orderBy: { position: 'asc' },
        include: {
            lessons: {
                orderBy: { position: 'asc' },
                select: {
                    id: true,
                    title: true,
                    contentType: true,
                    contentBody: true,
                    position: true,
                },
            },
        },
    });

    return serializeLiveSyllabus(modules);
}

function assertUniqueIds(snapshot: SyllabusSnapshot) {
    const moduleIds = new Set<string>();
    const lessonIds = new Set<string>();

    for (const moduleItem of snapshot.modules) {
        if (moduleItem.id) {
            if (moduleIds.has(moduleItem.id)) {
                throw new AppError(422, 'Duplicate module id in snapshot', 'VALIDATION_ERROR');
            }
            moduleIds.add(moduleItem.id);
        }

        for (const lesson of moduleItem.lessons) {
            if (!lesson.id) continue;
            if (lessonIds.has(lesson.id)) {
                throw new AppError(422, 'Duplicate lesson id in snapshot', 'VALIDATION_ERROR');
            }
            lessonIds.add(lesson.id);
        }
    }
}

export function computeSyllabusDiff(live: SyllabusSnapshot, draft: SyllabusSnapshot) {
    const liveModulesById = new Map<string, SyllabusModule>();
    for (const moduleItem of live.modules) {
        if (moduleItem.id) liveModulesById.set(moduleItem.id, moduleItem);
    }

    const liveLessonsById = new Map<string, SyllabusLesson>();
    for (const moduleItem of live.modules) {
        for (const lesson of moduleItem.lessons) {
            if (lesson.id) liveLessonsById.set(lesson.id, lesson);
        }
    }

    let modulesAdded = 0;
    let modulesRemoved = 0;
    let modulesUpdated = 0;
    let lessonsAdded = 0;
    let lessonsRemoved = 0;
    let lessonsUpdated = 0;

    const seenModuleIds = new Set<string>();
    const seenLessonIds = new Set<string>();

    draft.modules.forEach((moduleItem, moduleIndex) => {
        if (!moduleItem.id || !liveModulesById.has(moduleItem.id)) {
            modulesAdded += 1;
        } else {
            seenModuleIds.add(moduleItem.id);
            const liveModule = liveModulesById.get(moduleItem.id)!;
            if (liveModule.title !== moduleItem.title || liveModule.position !== moduleIndex) {
                modulesUpdated += 1;
            }
        }

        moduleItem.lessons.forEach((lesson, lessonIndex) => {
            if (!lesson.id || !liveLessonsById.has(lesson.id)) {
                lessonsAdded += 1;
            } else {
                seenLessonIds.add(lesson.id);
                const liveLesson = liveLessonsById.get(lesson.id)!;
                if (
                    liveLesson.title !== lesson.title ||
                    liveLesson.contentType !== lesson.contentType ||
                    (liveLesson.contentBody || null) !== (lesson.contentBody || null) ||
                    liveLesson.position !== lessonIndex
                ) {
                    lessonsUpdated += 1;
                }
            }
        });
    });

    for (const moduleItem of live.modules) {
        if (moduleItem.id && !seenModuleIds.has(moduleItem.id)) modulesRemoved += 1;
    }

    for (const lesson of live.modules.flatMap((moduleItem) => moduleItem.lessons)) {
        if (lesson.id && !seenLessonIds.has(lesson.id)) lessonsRemoved += 1;
    }

    return {
        modulesAdded,
        modulesRemoved,
        modulesUpdated,
        lessonsAdded,
        lessonsRemoved,
        lessonsUpdated,
        hasChanges:
            modulesAdded + modulesRemoved + modulesUpdated + lessonsAdded + lessonsRemoved + lessonsUpdated > 0,
    };
}

async function assertModuleDeletionAllowed(tx: Prisma.TransactionClient, moduleIds: string[]) {
    if (moduleIds.length === 0) return;

    const [assignmentCount, materialCount, recordingCount] = await Promise.all([
        tx.assignment.count({ where: { moduleId: { in: moduleIds } } }),
        tx.classMaterial.count({ where: { moduleId: { in: moduleIds } } }),
        tx.classRecording.count({ where: { moduleId: { in: moduleIds } } }),
    ]);

    if (assignmentCount + materialCount + recordingCount > 0) {
        throw new AppError(
            409,
            'Cannot delete module with linked assignments, materials, or recordings',
            'MODULE_DEPENDENCIES_EXIST'
        );
    }
}

async function assertLessonDeletionAllowed(tx: Prisma.TransactionClient, lessonIds: string[]) {
    if (lessonIds.length === 0) return;

    const progressCount = await tx.lessonProgress.count({
        where: { lessonId: { in: lessonIds } },
    });

    if (progressCount > 0) {
        throw new AppError(
            409,
            'Cannot delete lessons with learner progress history',
            'LESSON_PROGRESS_EXISTS'
        );
    }
}

export async function applySyllabusSnapshotToLive(
    tx: Prisma.TransactionClient,
    courseId: string,
    snapshot: SyllabusSnapshot
): Promise<SyllabusSnapshot> {
    assertUniqueIds(snapshot);

    const existingModules = await tx.module.findMany({
        where: { courseId },
        include: { lessons: true },
    });

    const moduleById = new Map(existingModules.map((moduleItem) => [moduleItem.id, moduleItem]));
    const lessonById = new Map(
        existingModules.flatMap((moduleItem) => moduleItem.lessons).map((lesson) => [lesson.id, lesson])
    );

    const retainedModuleIds = new Set<string>();
    const retainedLessonIds = new Set<string>();

    for (let moduleIndex = 0; moduleIndex < snapshot.modules.length; moduleIndex += 1) {
        const moduleItem = snapshot.modules[moduleIndex];

        let targetModuleId: string;
        if (moduleItem.id && moduleById.has(moduleItem.id)) {
            targetModuleId = moduleItem.id;
            await tx.module.update({
                where: { id: targetModuleId },
                data: {
                    title: moduleItem.title,
                    position: moduleIndex,
                },
            });
        } else {
            const created = await tx.module.create({
                data: {
                    courseId,
                    title: moduleItem.title,
                    position: moduleIndex,
                },
                select: { id: true },
            });
            targetModuleId = created.id;
        }

        retainedModuleIds.add(targetModuleId);

        for (let lessonIndex = 0; lessonIndex < moduleItem.lessons.length; lessonIndex += 1) {
            const lesson = moduleItem.lessons[lessonIndex];

            if (lesson.id && lessonById.has(lesson.id)) {
                retainedLessonIds.add(lesson.id);
                await tx.lesson.update({
                    where: { id: lesson.id },
                    data: {
                        moduleId: targetModuleId,
                        title: lesson.title,
                        contentType: lesson.contentType as ContentType,
                        contentBody: lesson.contentBody,
                        position: lessonIndex,
                    },
                });
            } else {
                const createdLesson = await tx.lesson.create({
                    data: {
                        moduleId: targetModuleId,
                        title: lesson.title,
                        contentType: lesson.contentType as ContentType,
                        contentBody: lesson.contentBody,
                        position: lessonIndex,
                    },
                    select: { id: true },
                });
                retainedLessonIds.add(createdLesson.id);
            }
        }
    }

    const existingLessonIds = Array.from(lessonById.keys());
    const lessonIdsToDelete = existingLessonIds.filter((id) => !retainedLessonIds.has(id));
    await assertLessonDeletionAllowed(tx, lessonIdsToDelete);

    if (lessonIdsToDelete.length > 0) {
        await tx.lesson.deleteMany({
            where: { id: { in: lessonIdsToDelete } },
        });
    }

    const existingModuleIds = Array.from(moduleById.keys());
    const moduleIdsToDelete = existingModuleIds.filter((id) => !retainedModuleIds.has(id));
    await assertModuleDeletionAllowed(tx, moduleIdsToDelete);

    if (moduleIdsToDelete.length > 0) {
        await tx.module.deleteMany({
            where: { id: { in: moduleIdsToDelete } },
        });
    }

    return getLiveSyllabusSnapshot(courseId, tx);
}
