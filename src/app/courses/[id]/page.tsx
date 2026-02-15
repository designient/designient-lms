'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/UI';
import Toast, { showToast } from '@/components/Toast';

interface Module {
    id: string;
    title: string;
    position: number;
    lessons: { id: string; title: string; contentType: string; position: number }[];
}

interface CourseDetail {
    id: string;
    title: string;
    slug: string;
    description: string;
    level: string;
    isPublished: boolean;
    creator: { id: string; name: string };
    modules: Module[];
    _count: { enrollments: number };
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const { data: session } = useSession();
    const router = useRouter();

    useEffect(() => {
        api.get<CourseDetail>(`/courses/${id}`).then((res) => {
            if (res.success && res.data) setCourse(res.data);
            setLoading(false);
        });
    }, [id]);

    const handleEnroll = async () => {
        if (!session) {
            router.push('/login');
            return;
        }
        setEnrolling(true);
        const res = await api.post(`/courses/${id}/enroll`);
        if (res.success) {
            showToast('success', 'Enrolled successfully!');
            setTimeout(() => router.push(`/courses/${id}/learn`), 1000);
        } else {
            showToast('error', res.error?.message || 'Enrollment failed');
        }
        setEnrolling(false);
    };

    if (loading) return <LoadingSpinner />;
    if (!course) return <div className="page-container"><h1>Course not found</h1></div>;

    const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

    return (
        <div className="page-container">
            <Toast />
            <div style={{ maxWidth: '900px' }}>
                <span className="badge badge-primary" style={{ marginBottom: '1rem', display: 'inline-block' }}>
                    {course.level}
                </span>
                <h1 className="page-title">{course.title}</h1>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                    by {course.creator?.name} • {course._count?.enrollments || 0} students enrolled
                </p>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', lineHeight: 1.7, fontSize: '1.0625rem' }}>
                    {course.description}
                </p>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <div className="stat-card" style={{ flex: 1, minWidth: '140px' }}>
                        <div className="stat-value">{course.modules.length}</div>
                        <div className="stat-label">Modules</div>
                    </div>
                    <div className="stat-card" style={{ flex: 1, minWidth: '140px' }}>
                        <div className="stat-value">{totalLessons}</div>
                        <div className="stat-label">Lessons</div>
                    </div>
                    <div className="stat-card" style={{ flex: 1, minWidth: '140px' }}>
                        <div className="stat-value">{course._count?.enrollments || 0}</div>
                        <div className="stat-label">Students</div>
                    </div>
                </div>

                {session?.user?.role === 'STUDENT' && (
                    <button className="btn btn-primary btn-lg" onClick={handleEnroll} disabled={enrolling} style={{ marginBottom: '2rem' }}>
                        {enrolling ? 'Enrolling...' : '🎓 Enroll Now — Free'}
                    </button>
                )}

                <h2 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '1rem' }}>Course Syllabus</h2>
                {course.modules.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)' }}>No modules yet.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {course.modules.map((mod, i) => (
                            <div key={mod.id} className="card" style={{ padding: '1rem 1.25rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    Module {i + 1}: {mod.title}
                                </h3>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    {mod.lessons.map((lesson) => (
                                        <li key={lesson.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem', color: 'var(--color-text-secondary)', padding: '0.25rem 0' }}>
                                            <span>{lesson.contentType === 'VIDEO' ? '🎥' : lesson.contentType === 'FILE' ? '📄' : '📝'}</span>
                                            {lesson.title}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
