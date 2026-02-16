'use client';

import { useState, useEffect, use } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface Lesson {
    id: string;
    title: string;
    contentType: string;
    contentBody: string;
    position: number;
    isCompleted: boolean;
}

interface Module {
    id: string;
    title: string;
    position: number;
    lessons: Lesson[];
    progress: number;
}

interface CourseLearn {
    id: string;
    title: string;
    modules: Module[];
    progress: number;
}

export default function StudentLearnPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [course, setCourse] = useState<CourseLearn | null>(null);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const { toast } = useToast();

    const fetchCourse = async () => {
        const res = await api.get<CourseLearn>(`/courses/${id}/learn`);
        if (res.success && res.data) {
            setCourse(res.data);
            const firstIncomplete = res.data.modules
                .flatMap((m) => m.lessons)
                .find((l) => !l.isCompleted);
            setActiveLesson(firstIncomplete || res.data.modules[0]?.lessons[0] || null);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCourse();
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleComplete = async () => {
        if (!activeLesson) return;
        setCompleting(true);
        const res = await api.post(`/lessons/${activeLesson.id}/complete`);
        if (res.success) {
            toast({ title: 'Lesson completed!', description: 'Great work, keep going!', variant: 'success' });
            await fetchCourse();
        }
        setCompleting(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="text-center py-16">
                <h2 className="text-lg font-semibold text-foreground mb-2">Course not found</h2>
                <p className="text-sm text-muted-foreground mb-4">You may not be enrolled in this course.</p>
                <Link href="/s/courses" className="text-primary hover:underline text-sm">
                    Back to My Courses
                </Link>
            </div>
        );
    }

    return (
        <div className="flex gap-6 -mx-6 -mt-6 min-h-[calc(100vh-3rem)]">
            {/* Lesson sidebar */}
            <aside className="w-80 flex-shrink-0 border-r border-border/50 bg-card overflow-y-auto">
                <div className="p-4 border-b border-border/50">
                    <Link
                        href="/s/courses"
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
                    >
                        <ChevronLeft className="h-3 w-3" /> Back to courses
                    </Link>
                    <h2 className="text-sm font-bold text-foreground mb-2 line-clamp-2">
                        {course.title}
                    </h2>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${course.progress}%` }}
                            />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                            {course.progress}%
                        </span>
                    </div>
                </div>

                <div className="p-2">
                    {course.modules.map((mod) => (
                        <div key={mod.id} className="mb-2">
                            <div className="flex items-center justify-between px-3 py-2">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    {mod.title}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {mod.progress}%
                                </span>
                            </div>
                            {mod.lessons.map((lesson) => {
                                const isActive = activeLesson?.id === lesson.id;
                                return (
                                    <button
                                        key={lesson.id}
                                        onClick={() => setActiveLesson(lesson)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm transition-colors ${
                                            isActive
                                                ? 'bg-primary/10 text-primary font-medium'
                                                : lesson.isCompleted
                                                  ? 'text-muted-foreground hover:bg-muted/50'
                                                  : 'text-foreground hover:bg-muted/50'
                                        }`}
                                    >
                                        <span className="text-xs flex-shrink-0">
                                            {lesson.isCompleted
                                                ? '✅'
                                                : lesson.contentType === 'VIDEO'
                                                  ? '🎥'
                                                  : '📝'}
                                        </span>
                                        <span className="truncate">{lesson.title}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 p-6 overflow-y-auto">
                {activeLesson ? (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                                    {activeLesson.contentType}
                                </span>
                                <h1 className="text-xl font-bold text-foreground mt-2">
                                    {activeLesson.title}
                                </h1>
                            </div>
                            {!activeLesson.isCompleted ? (
                                <button
                                    className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                    onClick={handleComplete}
                                    disabled={completing}
                                >
                                    {completing ? 'Completing...' : '✓ Mark Complete'}
                                </button>
                            ) : (
                                <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-lg">
                                    ✅ Completed
                                </span>
                            )}
                        </div>

                        {activeLesson.contentType === 'VIDEO' &&
                            activeLesson.contentBody && (
                                <div className="mb-6 bg-black rounded-xl overflow-hidden aspect-video">
                                    <iframe
                                        src={activeLesson.contentBody.replace(
                                            'watch?v=',
                                            'embed/'
                                        )}
                                        className="w-full h-full border-none"
                                        allowFullScreen
                                    />
                                </div>
                            )}

                        {activeLesson.contentType === 'TEXT' &&
                            activeLesson.contentBody && (
                                <div
                                    className="prose prose-sm dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{
                                        __html: activeLesson.contentBody,
                                    }}
                                />
                            )}

                        {activeLesson.contentType === 'FILE' &&
                            activeLesson.contentBody && (
                                <div className="rounded-xl border border-border/50 bg-card p-8 text-center">
                                    <span className="text-4xl mb-4 block">📄</span>
                                    <h3 className="text-base font-semibold text-foreground mb-2">
                                        Downloadable Resource
                                    </h3>
                                    <a
                                        href={activeLesson.contentBody}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                                    >
                                        ⬇ Download File
                                    </a>
                                </div>
                            )}
                    </>
                ) : (
                    <div className="text-center py-16">
                        <span className="text-4xl mb-4 block">🎉</span>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            All lessons completed!
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Congratulations on finishing this course.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
