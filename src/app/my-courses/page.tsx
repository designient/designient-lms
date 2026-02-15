'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { LoadingSpinner, EmptyState, ProgressBar } from '@/components/UI';

interface EnrolledCourse {
    id: string;
    enrolledAt: string;
    course: { id: string; title: string; slug: string; description: string; level: string; creator: { name: string } };
    progress: number;
    totalLessons: number;
    completedLessons: number;
}

export default function MyCoursesPage() {
    const [courses, setCourses] = useState<EnrolledCourse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ courses: EnrolledCourse[] }>('/me/courses').then((res) => {
            if (res.success && res.data) setCourses(res.data.courses);
            setLoading(false);
        });
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <h1 className="page-title">My Courses</h1>
            <p className="page-subtitle">Continue learning where you left off</p>

            {courses.length === 0 ? (
                <EmptyState icon="📚" title="No courses yet" message="Browse the catalog and enroll in a course to get started" />
            ) : (
                <div className="grid-3">
                    {courses.map((item) => (
                        <Link key={item.id} href={`/courses/${item.course.id}/learn`}>
                            <div className="course-card">
                                <div className="course-card-body">
                                    <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>
                                        {item.course.level}
                                    </span>
                                    <h3 className="course-card-title">{item.course.title}</h3>
                                    <p className="course-card-desc">{item.course.description}</p>
                                    <div style={{ marginTop: '0.75rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
                                            <span>{item.completedLessons} / {item.totalLessons} lessons</span>
                                            <span>{item.progress}%</span>
                                        </div>
                                        <ProgressBar value={item.progress} />
                                    </div>
                                </div>
                                <div className="course-card-footer">
                                    <span>by {item.course.creator?.name}</span>
                                    <span>{item.progress === 100 ? '✅ Complete' : '▶ Continue'}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
