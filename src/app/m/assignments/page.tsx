'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, Plus, FileText, ListChecks } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface CourseOption {
    id: string;
    title: string;
}

interface AssignmentItem {
    id: string;
    title: string;
    description: string | null;
    dueAt: string | null;
    maxScore: number;
    isPublished: boolean;
    _count: { submissions: number };
}

export default function MentorAssignmentsPage() {
    const searchParams = useSearchParams();
    const defaultCourseId = searchParams.get('courseId') || '';
    const { toast } = useToast();

    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [activeCourse, setActiveCourse] = useState('');
    const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        dueDate: '',
        maxScore: '100',
        isPublished: true,
    });

    useEffect(() => {
        apiClient.get<{ cohorts: Array<{ courses: CourseOption[] }> }>('/api/v1/instructor/cohorts')
            .then((res) => {
                const map = new Map<string, CourseOption>();
                res.cohorts.forEach((cohort) => cohort.courses.forEach((course) => map.set(course.id, course)));
                const list = Array.from(map.values());
                setCourses(list);

                if (defaultCourseId && list.some((c) => c.id === defaultCourseId)) {
                    setActiveCourse(defaultCourseId);
                } else if (list.length > 0) {
                    setActiveCourse(list[0].id);
                }
            })
            .catch(() => setCourses([]))
            .finally(() => setIsLoading(false));
    }, [defaultCourseId]);

    const fetchAssignments = async (courseId: string) => {
        const res = await apiClient.get<{ assignments: AssignmentItem[] }>(`/api/v1/courses/${courseId}/assignments?limit=200`);
        setAssignments(res.assignments);
    };

    useEffect(() => {
        if (!activeCourse) return;
        const timer = setTimeout(() => {
            fetchAssignments(activeCourse).catch(console.error);
        }, 0);
        return () => clearTimeout(timer);
    }, [activeCourse]);

    const activeCourseTitle = useMemo(
        () => courses.find((c) => c.id === activeCourse)?.title || '',
        [courses, activeCourse]
    );

    const handleCreate = async () => {
        if (!activeCourse) return;
        try {
            const payload: Record<string, unknown> = {
                title: form.title,
                description: form.description || undefined,
                maxScore: Number(form.maxScore) || 100,
                isPublished: form.isPublished,
            };
            if (form.dueDate) {
                payload.dueAt = new Date(`${form.dueDate}T23:59:00`).toISOString();
            }

            await apiClient.post(`/api/v1/courses/${activeCourse}/assignments`, payload);
            toast({ title: 'Assignment created', variant: 'success' });
            setShowCreate(false);
            setForm({ title: '', description: '', dueDate: '', maxScore: '100', isPublished: true });
            await fetchAssignments(activeCourse);
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to create assignment.',
                variant: 'error',
            });
        }
    };

    if (isLoading) {
        return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    if (courses.length === 0) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Assignments</h1>
                    <p className="text-muted-foreground mt-1">Create assignments and task workflows for your students</p>
                </div>
                <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
                    <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">No syllabus courses assigned yet</p>
                    <p className="text-xs text-muted-foreground">Ask admin to link a program syllabus to your cohorts first.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Assignments</h1>
                    <p className="text-muted-foreground mt-1">Create assignments and open task boards for each assignment</p>
                </div>
                <Button onClick={() => setShowCreate(!showCreate)} className="gap-2"><Plus className="h-4 w-4" /> New Assignment</Button>
            </div>

            <div className="flex gap-2 flex-wrap">
                {courses.map((course) => (
                    <button
                        key={course.id}
                        onClick={() => setActiveCourse(course.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeCourse === course.id ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                    >
                        {course.title}
                    </button>
                ))}
            </div>

            {showCreate && (
                <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
                    <p className="text-xs text-muted-foreground">Creating for: <span className="font-medium text-foreground">{activeCourseTitle}</span></p>
                    <input
                        type="text"
                        placeholder="Assignment title"
                        value={form.title}
                        onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm"
                    />
                    <textarea
                        placeholder="Description (optional)"
                        value={form.description}
                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                            type="date"
                            value={form.dueDate}
                            onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                            className="px-3 py-2 rounded-lg border border-border/60 bg-background text-sm"
                        />
                        <input
                            type="number"
                            min={1}
                            value={form.maxScore}
                            onChange={(e) => setForm((prev) => ({ ...prev, maxScore: e.target.value }))}
                            className="px-3 py-2 rounded-lg border border-border/60 bg-background text-sm"
                        />
                        <label className="flex items-center gap-2 text-sm text-foreground px-3 py-2 rounded-lg border border-border/60 bg-background">
                            <input
                                type="checkbox"
                                checked={form.isPublished}
                                onChange={(e) => setForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
                            />
                            Publish now
                        </label>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleCreate} disabled={!form.title}>Create Assignment</Button>
                        <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {assignments.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
                        <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">No assignments yet for this course</p>
                    </div>
                ) : assignments.map((assignment) => (
                    <div key={assignment.id} className="rounded-xl border border-border/50 bg-card p-4 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-foreground">{assignment.title}</h3>
                            {assignment.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{assignment.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span>Max {assignment.maxScore} pts</span>
                                <span>•</span>
                                <span>{assignment._count.submissions} submissions</span>
                                {assignment.dueAt && (
                                    <>
                                        <span>•</span>
                                        <span>Due {new Date(assignment.dueAt).toLocaleDateString()}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Link
                                href={`/m/assignments/${assignment.id}/tasks`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
                            >
                                <ListChecks className="h-3.5 w-3.5" />
                                Manage Tasks
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
