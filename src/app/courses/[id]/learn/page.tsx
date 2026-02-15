'use client';

import { useState, useEffect, use } from 'react';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/UI';
import Toast, { showToast } from '@/components/Toast';

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

export default function LearnPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [course, setCourse] = useState<CourseLearn | null>(null);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);

    const fetchCourse = async () => {
        const res = await api.get<CourseLearn>(`/courses/${id}/learn`);
        if (res.success && res.data) {
            setCourse(res.data);
            // Auto-select first incomplete lesson
            const firstIncomplete = res.data.modules
                .flatMap((m) => m.lessons)
                .find((l) => !l.isCompleted);
            setActiveLesson(firstIncomplete || res.data.modules[0]?.lessons[0] || null);
        }
        setLoading(false);
    };

    useEffect(() => { fetchCourse(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleComplete = async () => {
        if (!activeLesson) return;
        setCompleting(true);
        const res = await api.post(`/lessons/${activeLesson.id}/complete`);
        if (res.success) {
            showToast('success', 'Lesson completed! 🎉');
            await fetchCourse();
        }
        setCompleting(false);
    };

    if (loading) return <LoadingSpinner />;
    if (!course) return <div className="page-container"><h1>Course not found or not enrolled</h1></div>;

    return (
        <div className="learn-layout">
            <Toast />
            <aside className="learn-sidebar">
                <div style={{ padding: 'var(--space-lg)' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{course.title}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div className="progress-bar" style={{ flex: 1 }}>
                            <div className="progress-fill" style={{ width: `${course.progress}%` }} />
                        </div>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{course.progress}%</span>
                    </div>
                </div>
                {course.modules.map((mod) => (
                    <div key={mod.id} className="learn-module">
                        <div className="learn-module-header">
                            <span>{mod.title}</span>
                            <span style={{ fontSize: '0.75rem' }}>{mod.progress}%</span>
                        </div>
                        {mod.lessons.map((lesson) => (
                            <div
                                key={lesson.id}
                                className={`learn-lesson ${activeLesson?.id === lesson.id ? 'active' : ''} ${lesson.isCompleted ? 'completed' : ''}`}
                                onClick={() => setActiveLesson(lesson)}
                            >
                                <span>{lesson.isCompleted ? '✅' : lesson.contentType === 'VIDEO' ? '🎥' : '📝'}</span>
                                <span>{lesson.title}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </aside>

            <div className="learn-content">
                {activeLesson ? (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
                            <div>
                                <span className="badge badge-primary" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
                                    {activeLesson.contentType}
                                </span>
                                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{activeLesson.title}</h1>
                            </div>
                            {!activeLesson.isCompleted && (
                                <button className="btn btn-primary" onClick={handleComplete} disabled={completing}>
                                    {completing ? 'Completing...' : '✓ Mark Complete'}
                                </button>
                            )}
                            {activeLesson.isCompleted && (
                                <span className="badge badge-success" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>✅ Completed</span>
                            )}
                        </div>

                        {activeLesson.contentType === 'VIDEO' && activeLesson.contentBody && (
                            <div style={{ marginBottom: 'var(--space-xl)', background: '#000', borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '16/9' }}>
                                <iframe
                                    src={activeLesson.contentBody.replace('watch?v=', 'embed/')}
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                    allowFullScreen
                                />
                            </div>
                        )}

                        {activeLesson.contentType === 'TEXT' && activeLesson.contentBody && (
                            <div className="lesson-content" dangerouslySetInnerHTML={{ __html: activeLesson.contentBody }} />
                        )}

                        {activeLesson.contentType === 'FILE' && activeLesson.contentBody && (
                            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                                <span style={{ fontSize: '3rem' }}>📄</span>
                                <h3 style={{ margin: '1rem 0 0.5rem' }}>Downloadable Resource</h3>
                                <a href={activeLesson.contentBody} target="_blank" rel="noreferrer">
                                    <button className="btn btn-primary">⬇ Download File</button>
                                </a>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="empty-state">
                        <span style={{ fontSize: '3rem' }}>🎉</span>
                        <h3>All lessons completed!</h3>
                        <p>Congratulations on finishing this course.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
