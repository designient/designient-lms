'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ModuleTree, type SyllabusSelection } from '@/components/syllabus/ModuleTree';
import { LessonEditor } from '@/components/syllabus/LessonEditor';
import { ApprovalPanel } from '@/components/syllabus/ApprovalPanel';
import type {
    SyllabusBuilderPermissions,
    SyllabusDraftMeta,
    SyllabusLesson,
    SyllabusModule,
    SyllabusSnapshot,
} from '@/types/syllabus';
import { Loader2, Sparkles } from 'lucide-react';

interface SyllabusBuilderResponse {
    featureEnabled: boolean;
    course: {
        id: string;
        title: string;
        isPublished: boolean;
        program: { id: string; name: string; status: string } | null;
    };
    liveSnapshot: SyllabusSnapshot;
    draft: SyllabusDraftMeta | null;
    permissions: SyllabusBuilderPermissions;
    diff: {
        modulesAdded: number;
        modulesRemoved: number;
        modulesUpdated: number;
        lessonsAdded: number;
        lessonsRemoved: number;
        lessonsUpdated: number;
        hasChanges: boolean;
    } | null;
}

interface SyllabusBuilderProps {
    courseId: string;
    portal: 'admin' | 'mentor';
}

function makeLocalId() {
    return `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function reindexSnapshot(snapshot: SyllabusSnapshot): SyllabusSnapshot {
    return {
        modules: snapshot.modules.map((moduleItem, moduleIndex) => ({
            ...moduleItem,
            position: moduleIndex,
            lessons: moduleItem.lessons.map((lesson, lessonIndex) => ({
                ...lesson,
                position: lessonIndex,
            })),
        })),
    };
}

function snapshotHash(snapshot: SyllabusSnapshot): string {
    return JSON.stringify(reindexSnapshot(snapshot));
}

function ensureLocalIds(snapshot: SyllabusSnapshot): SyllabusSnapshot {
    return {
        modules: snapshot.modules.map((moduleItem, moduleIndex) => ({
            ...moduleItem,
            id: moduleItem.id || makeLocalId(),
            position: moduleIndex,
            lessons: moduleItem.lessons.map((lesson, lessonIndex) => ({
                ...lesson,
                id: lesson.id || makeLocalId(),
                position: lessonIndex,
            })),
        })),
    };
}

function toEmbedUrl(value: string | null): string | null {
    const input = (value || '').trim();
    if (!input) return null;

    try {
        const url = new URL(input);
        if (url.hostname.includes('youtube.com')) {
            const videoId = url.searchParams.get('v');
            if (videoId) return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.hostname === 'youtu.be') {
            return `https://www.youtube.com/embed/${url.pathname.replace('/', '')}`;
        }
        return input;
    } catch {
        return null;
    }
}

export function SyllabusBuilder({ courseId, portal }: SyllabusBuilderProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [data, setData] = useState<SyllabusBuilderResponse | null>(null);
    const [workingSnapshot, setWorkingSnapshot] = useState<SyllabusSnapshot>({ modules: [] });
    const [selection, setSelection] = useState<SyllabusSelection | null>(null);
    const [persistedHash, setPersistedHash] = useState('');
    const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
    const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isPending = data?.draft?.status === 'PENDING_APPROVAL';
    const canEditMentorDraft = Boolean(
        data?.permissions.role === 'MENTOR' && data.permissions.canEditDraft && !isPending
    );
    const canEditAdminLive = Boolean(
        data?.permissions.canEditLive && data.permissions.role === 'ADMIN' && !isPending
    );
    const canEdit = canEditMentorDraft || canEditAdminLive;

    const loadBuilder = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get<SyllabusBuilderResponse>(`/api/v1/courses/${courseId}/builder`);
            setData(response);

            const sourceSnapshot = response.draft?.status === 'PENDING_APPROVAL'
                ? response.draft.snapshot
                : response.permissions.role === 'MENTOR'
                    ? response.draft?.snapshot || response.liveSnapshot
                    : response.liveSnapshot;

            const hydrated = ensureLocalIds(reindexSnapshot(sourceSnapshot));
            setWorkingSnapshot(hydrated);
            setSelection(
                hydrated.modules.length > 0
                    ? { moduleIndex: 0, lessonIndex: hydrated.modules[0].lessons.length > 0 ? 0 : null }
                    : null
            );
            setPersistedHash(snapshotHash(hydrated));
            setSaveState('saved');
            setLastSavedAt(response.draft?.updatedAt || null);
        } catch (error) {
            toast({
                title: 'Unable to load syllabus builder',
                description: error instanceof Error ? error.message : 'Unknown error',
                variant: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [courseId, toast]);

    useEffect(() => {
        loadBuilder();
    }, [loadBuilder]);

    const currentHash = useMemo(() => snapshotHash(workingSnapshot), [workingSnapshot]);

    useEffect(() => {
        if (!data || loading) return;
        if (currentHash === persistedHash) {
            if (saveState !== 'saving') setSaveState('saved');
            return;
        }
        if (saveState !== 'saving') setSaveState('unsaved');
    }, [currentHash, persistedHash, data, loading, saveState]);

    const saveDraft = useCallback(
        async (notify = false) => {
            if (!canEditMentorDraft) return;

            setSaveState('saving');
            try {
                const draft = await apiClient.put<SyllabusDraftMeta>(
                    `/api/v1/courses/${courseId}/draft`,
                    { snapshot: workingSnapshot }
                );
                setPersistedHash(snapshotHash(workingSnapshot));
                setSaveState('saved');
                setLastSavedAt(draft.updatedAt);
                setData((prev) => (prev ? { ...prev, draft } : prev));
                if (notify) {
                    toast({ title: 'Draft saved', variant: 'success' });
                }
            } catch (error) {
                setSaveState('error');
                toast({
                    title: 'Draft save failed',
                    description: error instanceof Error ? error.message : 'Unknown error',
                    variant: 'error',
                });
                throw error;
            }
        },
        [canEditMentorDraft, courseId, workingSnapshot, toast]
    );

    useEffect(() => {
        if (!canEditMentorDraft) return;
        if (currentHash === persistedHash) return;

        if (autosaveRef.current) clearTimeout(autosaveRef.current);
        autosaveRef.current = setTimeout(() => {
            saveDraft(false).catch(() => undefined);
        }, 900);

        return () => {
            if (autosaveRef.current) clearTimeout(autosaveRef.current);
        };
    }, [canEditMentorDraft, currentHash, persistedHash, saveDraft]);

    const updateSnapshot = useCallback((next: SyllabusSnapshot) => {
        setWorkingSnapshot(ensureLocalIds(reindexSnapshot(next)));
    }, []);

    const selectedModule =
        selection && workingSnapshot.modules[selection.moduleIndex]
            ? workingSnapshot.modules[selection.moduleIndex]
            : null;

    const selectedLesson =
        selectedModule && selection?.lessonIndex !== null && selection?.lessonIndex !== undefined
            ? selectedModule.lessons[selection.lessonIndex] || null
            : null;

    const handleAddModule = () => {
        const nextModule: SyllabusModule = {
            id: makeLocalId(),
            title: `Module ${workingSnapshot.modules.length + 1}`,
            position: workingSnapshot.modules.length,
            lessons: [],
        };
        updateSnapshot({
            modules: [...workingSnapshot.modules, nextModule],
        });
        setSelection({ moduleIndex: workingSnapshot.modules.length, lessonIndex: null });
    };

    const handleAddLesson = (moduleIndex: number) => {
        const moduleItem = workingSnapshot.modules[moduleIndex];
        if (!moduleItem) return;

        const nextLesson: SyllabusLesson = {
            id: makeLocalId(),
            title: `Lesson ${moduleItem.lessons.length + 1}`,
            contentType: 'TEXT',
            contentBody: '',
            position: moduleItem.lessons.length,
        };

        const modules = [...workingSnapshot.modules];
        modules[moduleIndex] = {
            ...moduleItem,
            lessons: [...moduleItem.lessons, nextLesson],
        };

        updateSnapshot({ modules });
        setSelection({ moduleIndex, lessonIndex: moduleItem.lessons.length });
    };

    const handleDeleteModule = (moduleIndex: number) => {
        const modules = workingSnapshot.modules.filter((_, index) => index !== moduleIndex);
        updateSnapshot({ modules });
        if (modules.length === 0) {
            setSelection(null);
            return;
        }
        const nextModuleIndex = Math.max(0, Math.min(moduleIndex, modules.length - 1));
        const nextLessonIndex = modules[nextModuleIndex].lessons.length > 0 ? 0 : null;
        setSelection({ moduleIndex: nextModuleIndex, lessonIndex: nextLessonIndex });
    };

    const handleDeleteLesson = (moduleIndex: number, lessonIndex: number) => {
        const modules = [...workingSnapshot.modules];
        const moduleItem = modules[moduleIndex];
        if (!moduleItem) return;

        modules[moduleIndex] = {
            ...moduleItem,
            lessons: moduleItem.lessons.filter((_, index) => index !== lessonIndex),
        };

        updateSnapshot({ modules });
        if (selection?.moduleIndex === moduleIndex && selection.lessonIndex === lessonIndex) {
            const nextIndex = modules[moduleIndex].lessons.length > 0
                ? Math.max(0, Math.min(lessonIndex, modules[moduleIndex].lessons.length - 1))
                : null;
            setSelection({ moduleIndex, lessonIndex: nextIndex });
        }
    };

    const handleReorderModules = (fromIndex: number, toIndex: number) => {
        const modules = [...workingSnapshot.modules];
        const [moved] = modules.splice(fromIndex, 1);
        modules.splice(toIndex, 0, moved);
        updateSnapshot({ modules });

        if (selection?.moduleIndex === fromIndex) {
            setSelection({ ...selection, moduleIndex: toIndex });
        }
    };

    const handleMoveLesson = (
        fromModuleIndex: number,
        fromLessonIndex: number,
        toModuleIndex: number,
        toLessonIndex: number
    ) => {
        const modules = [...workingSnapshot.modules];
        const source = modules[fromModuleIndex];
        const target = modules[toModuleIndex];
        if (!source || !target) return;

        const sourceLessons = [...source.lessons];
        const [movedLesson] = sourceLessons.splice(fromLessonIndex, 1);
        if (!movedLesson) return;

        const targetLessons = fromModuleIndex === toModuleIndex ? sourceLessons : [...target.lessons];
        const insertionIndex = Math.max(0, Math.min(toLessonIndex, targetLessons.length));
        targetLessons.splice(insertionIndex, 0, movedLesson);

        modules[fromModuleIndex] = { ...source, lessons: sourceLessons };
        modules[toModuleIndex] = { ...target, lessons: targetLessons };

        updateSnapshot({ modules });
        setSelection({ moduleIndex: toModuleIndex, lessonIndex: insertionIndex });
    };

    const updateSelectedModule = (patch: Partial<SyllabusModule>) => {
        if (!selection) return;
        const modules = [...workingSnapshot.modules];
        const moduleItem = modules[selection.moduleIndex];
        if (!moduleItem) return;

        modules[selection.moduleIndex] = {
            ...moduleItem,
            ...patch,
        };

        updateSnapshot({ modules });
    };

    const updateSelectedLesson = (nextLesson: SyllabusLesson) => {
        if (!selection || selection.lessonIndex === null) return;
        const modules = [...workingSnapshot.modules];
        const moduleItem = modules[selection.moduleIndex];
        if (!moduleItem) return;

        const lessons = [...moduleItem.lessons];
        lessons[selection.lessonIndex] = nextLesson;
        modules[selection.moduleIndex] = {
            ...moduleItem,
            lessons,
        };

        updateSnapshot({ modules });
    };

    const handleSubmitForApproval = async () => {
        if (!canEditMentorDraft) return;

        setSubmitting(true);
        try {
            if (currentHash !== persistedHash) {
                await saveDraft(false);
            }

            await apiClient.post(`/api/v1/courses/${courseId}/draft/submit`, {});
            toast({ title: 'Draft submitted for approval', variant: 'success' });
            await loadBuilder();
        } catch (error) {
            toast({
                title: 'Submit failed',
                description: error instanceof Error ? error.message : 'Unknown error',
                variant: 'error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleWithdraw = async () => {
        setSubmitting(true);
        try {
            await apiClient.post(`/api/v1/courses/${courseId}/draft/withdraw`, {});
            toast({ title: 'Draft withdrawn', variant: 'success' });
            await loadBuilder();
        } catch (error) {
            toast({
                title: 'Withdraw failed',
                description: error instanceof Error ? error.message : 'Unknown error',
                variant: 'error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveLive = async () => {
        if (!canEditAdminLive) return;

        setSubmitting(true);
        try {
            const response = await apiClient.put<{ liveSnapshot: SyllabusSnapshot; draft: SyllabusDraftMeta }>(
                `/api/v1/courses/${courseId}/builder`,
                { snapshot: workingSnapshot }
            );

            const hydrated = ensureLocalIds(response.liveSnapshot);
            setWorkingSnapshot(hydrated);
            setPersistedHash(snapshotHash(hydrated));
            setSaveState('saved');
            setData((prev) =>
                prev
                    ? {
                        ...prev,
                        liveSnapshot: response.liveSnapshot,
                        draft: response.draft,
                    }
                    : prev
            );
            toast({ title: 'Live syllabus saved', variant: 'success' });
        } catch (error) {
            toast({
                title: 'Live save failed',
                description: error instanceof Error ? error.message : 'Unknown error',
                variant: 'error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async () => {
        await apiClient.post(`/api/v1/courses/${courseId}/draft/review`, { action: 'APPROVE' });
        toast({ title: 'Draft approved and published', variant: 'success' });
        await loadBuilder();
    };

    const handleReject = async (comment: string) => {
        await apiClient.post(`/api/v1/courses/${courseId}/draft/review`, {
            action: 'REJECT',
            comment,
        });
        toast({ title: 'Draft rejected', variant: 'warning' });
        await loadBuilder();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                Unable to load syllabus builder.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-border/50 bg-card px-4 py-3 flex items-center justify-between gap-4">
                <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Syllabus Builder</div>
                    <h1 className="text-xl font-bold text-foreground">{data.course.title}</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Program: {data.course.program?.name || 'Unlinked'}
                    </p>
                </div>
                <div className="text-right">
                    <div className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                        {data.permissions.role === 'ADMIN' ? 'Admin' : 'Mentor'} view
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {saveState === 'saving' ? 'Saving...' : saveState === 'unsaved' ? 'Unsaved changes' : saveState === 'error' ? 'Save failed' : 'All changes saved'}
                    </div>
                    {lastSavedAt && (
                        <div className="text-[11px] text-muted-foreground">
                            Last saved {new Date(lastSavedAt).toLocaleTimeString()}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)_380px] gap-4 min-h-[640px]">
                <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                    <ModuleTree
                        modules={workingSnapshot.modules}
                        selection={selection}
                        readOnly={!canEdit}
                        onSelectModule={(moduleIndex) => setSelection({ moduleIndex, lessonIndex: null })}
                        onSelectLesson={(moduleIndex, lessonIndex) =>
                            setSelection({ moduleIndex, lessonIndex })
                        }
                        onAddModule={handleAddModule}
                        onAddLesson={handleAddLesson}
                        onDeleteModule={handleDeleteModule}
                        onDeleteLesson={handleDeleteLesson}
                        onReorderModules={handleReorderModules}
                        onMoveLesson={handleMoveLesson}
                    />
                </div>

                <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
                    {!selection || !selectedModule ? (
                        <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                            Select a module or lesson to edit.
                        </div>
                    ) : selectedLesson ? (
                        <LessonEditor
                            lesson={selectedLesson}
                            disabled={!canEdit}
                            onChange={updateSelectedLesson}
                        />
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Module title</label>
                                <Input
                                    value={selectedModule.title}
                                    onChange={(event) => updateSelectedModule({ title: event.target.value })}
                                    disabled={!canEdit}
                                    placeholder="e.g. Prompt Strategy Fundamentals"
                                />
                            </div>
                            <div className="rounded-lg border border-border/50 bg-background p-3 text-xs text-muted-foreground">
                                Module contains {selectedModule.lessons.length} lesson{selectedModule.lessons.length === 1 ? '' : 's'}.
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Preview
                        </div>

                        {!selectedLesson ? (
                            <div className="text-xs text-muted-foreground">Select a lesson to preview its content.</div>
                        ) : selectedLesson.contentType === 'TEXT' ? (
                            selectedLesson.contentBody ? (
                                <div className="w-full overflow-x-auto rounded-md border border-border/40 bg-background p-3">
                                    <div
                                        className="prose prose-sm max-w-none text-sm text-foreground [&_table]:w-full [&_table]:min-w-[560px]"
                                        dangerouslySetInnerHTML={{ __html: selectedLesson.contentBody }}
                                    />
                                </div>
                            ) : (
                                <div className="text-xs text-muted-foreground">No content added yet.</div>
                            )
                        ) : selectedLesson.contentType === 'VIDEO' ? (
                            toEmbedUrl(selectedLesson.contentBody) ? (
                                <iframe
                                    src={toEmbedUrl(selectedLesson.contentBody) || undefined}
                                    className="w-full aspect-video rounded-md border border-border/40"
                                    allowFullScreen
                                />
                            ) : (
                                <div className="text-xs text-muted-foreground">Add a valid video URL to preview.</div>
                            )
                        ) : selectedLesson.contentBody ? (
                            <a
                                href={selectedLesson.contentBody}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-primary underline break-all"
                            >
                                {selectedLesson.contentBody}
                            </a>
                        ) : (
                            <div className="text-xs text-muted-foreground">Add a file URL to preview.</div>
                        )}
                    </div>

                    <ApprovalPanel
                        draft={data.draft}
                        diff={data.diff}
                        canApprove={Boolean(data.permissions.canApprove)}
                        onApprove={handleApprove}
                        onReject={handleReject}
                    />
                </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-card px-4 py-3 flex items-center justify-between gap-3">
                {canEditMentorDraft ? (
                    <>
                        <div className="text-xs text-muted-foreground">
                            Draft mode with auto-save. Submit when ready for admin approval.
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => saveDraft(true)}
                                variant="outline"
                                disabled={submitting || saveState === 'saving'}
                            >
                                Save draft
                            </Button>
                            <Button
                                onClick={handleSubmitForApproval}
                                disabled={submitting}
                            >
                                {submitting ? 'Submitting...' : 'Submit for approval'}
                            </Button>
                        </div>
                    </>
                ) : isPending && data.permissions.role === 'MENTOR' ? (
                    <>
                        <div className="text-xs text-muted-foreground">
                            Draft is pending admin review. You can withdraw to continue editing.
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleWithdraw}
                            disabled={submitting}
                        >
                            {submitting ? 'Withdrawing...' : 'Withdraw'}
                        </Button>
                    </>
                ) : canEditAdminLive ? (
                    <>
                        <div className="text-xs text-muted-foreground">
                            You are editing live syllabus content.
                        </div>
                        <Button onClick={handleSaveLive} disabled={submitting || saveState === 'saving'}>
                            {submitting ? 'Saving...' : 'Save live'}
                        </Button>
                    </>
                ) : (
                    <div className="text-xs text-muted-foreground w-full">
                        {portal === 'admin'
                            ? 'Pending draft detected. Review from the approval panel.'
                            : 'Read-only mode.'}
                    </div>
                )}
            </div>
        </div>
    );
}
