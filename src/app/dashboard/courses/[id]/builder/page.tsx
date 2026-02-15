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
}

interface Module {
    id: string;
    title: string;
    position: number;
    lessons: Lesson[];
}

interface CourseDetail {
    id: string;
    title: string;
    modules: Module[];
}

export default function CourseBuilderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [modTitle, setModTitle] = useState('');
    const [lessonData, setLessonData] = useState<{
        moduleId: string;
        title: string;
        contentType: string;
        contentBody: string;
    } | null>(null);

    const fetchCourse = async () => {
        const res = await api.get<CourseDetail>(`/courses/${id}`);
        if (res.success && res.data) setCourse(res.data);
        setLoading(false);
    };

    useEffect(() => { fetchCourse(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    const addModule = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await api.post(`/courses/${id}/modules`, { title: modTitle });
        if (res.success) { showToast('success', 'Module added'); setModTitle(''); fetchCourse(); }
        else showToast('error', res.error?.message || 'Failed');
    };

    const deleteModule = async (modId: string) => {
        const res = await api.delete(`/modules/${modId}`);
        if (res.success) { showToast('success', 'Module deleted'); fetchCourse(); }
        else showToast('error', res.error?.message || 'Failed');
    };

    const addLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lessonData) return;
        const res = await api.post(`/modules/${lessonData.moduleId}/lessons`, {
            title: lessonData.title,
            contentType: lessonData.contentType,
            contentBody: lessonData.contentBody,
        });
        if (res.success) { showToast('success', 'Lesson added'); setLessonData(null); fetchCourse(); }
        else showToast('error', res.error?.message || 'Failed');
    };

    const deleteLesson = async (lessonId: string) => {
        const res = await api.delete(`/lessons/${lessonId}`);
        if (res.success) { showToast('success', 'Lesson deleted'); fetchCourse(); }
        else showToast('error', res.error?.message || 'Failed');
    };

    if (loading) return <LoadingSpinner />;
    if (!course) return <div className="page-container"><h1>Course not found</h1></div>;

    return (
        <div className="page-container">
            <Toast />
            <h1 className="page-title">Course Builder</h1>
            <p className="page-subtitle">{course.title}</p>

            <form onSubmit={addModule} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
                <input className="form-input" placeholder="New module title" value={modTitle} onChange={(e) => setModTitle(e.target.value)} required style={{ flex: 1 }} />
                <button type="submit" className="btn btn-primary">+ Add Module</button>
            </form>

            {course.modules.map((mod, i) => (
                <div key={mod.id} className="card" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Module {i + 1}: {mod.title}</h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setLessonData({ moduleId: mod.id, title: '', contentType: 'TEXT', contentBody: '' })}>+ Lesson</button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteModule(mod.id)}>Delete</button>
                        </div>
                    </div>

                    {mod.lessons.map((lesson) => (
                        <div key={lesson.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--color-border)', fontSize: '0.9375rem' }}>
                            <span>
                                {lesson.contentType === 'VIDEO' ? '🎥' : lesson.contentType === 'FILE' ? '📄' : '📝'}{' '}
                                {lesson.title}
                            </span>
                            <button className="btn btn-ghost btn-sm" onClick={() => deleteLesson(lesson.id)} style={{ color: 'var(--color-danger)' }}>×</button>
                        </div>
                    ))}

                    {lessonData?.moduleId === mod.id && (
                        <form onSubmit={addLesson} style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input className="form-input" value={lessonData.title} onChange={(e) => setLessonData({ ...lessonData, title: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Content Type</label>
                                <select className="form-select" value={lessonData.contentType} onChange={(e) => setLessonData({ ...lessonData, contentType: e.target.value })}>
                                    <option value="TEXT">Text</option>
                                    <option value="VIDEO">Video URL</option>
                                    <option value="FILE">File Link</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{lessonData.contentType === 'TEXT' ? 'Content (HTML)' : 'URL'}</label>
                                <textarea className="form-textarea" value={lessonData.contentBody} onChange={(e) => setLessonData({ ...lessonData, contentBody: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="submit" className="btn btn-primary btn-sm">Save Lesson</button>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLessonData(null)}>Cancel</button>
                            </div>
                        </form>
                    )}
                </div>
            ))}
        </div>
    );
}
