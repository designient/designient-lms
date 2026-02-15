'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { LoadingSpinner, EmptyState } from '@/components/UI';

interface Course {
    id: string;
    title: string;
    slug: string;
    description: string;
    level: string;
    creator: { name: string };
    _count: { modules: number; enrollments: number };
}

const levelEmoji: Record<string, string> = {
    BEGINNER: '🟢',
    INTERMEDIATE: '🟡',
    ADVANCED: '🔴',
};

export default function CourseCatalogPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [level, setLevel] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchCourses = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('page', String(page));
        if (search) params.set('search', search);
        if (level) params.set('level', level);

        const res = await api.get<{ courses: Course[]; pagination: { totalPages: number } }>(
            `/courses?${params}`
        );
        if (res.success && res.data) {
            setCourses(res.data.courses);
            setTotalPages(res.data.pagination.totalPages);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCourses();
    }, [page, level]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchCourses();
    };

    return (
        <div className="page-container">
            <h1 className="page-title">Course Catalog</h1>
            <p className="page-subtitle">Discover our expert-led courses and start learning</p>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Search courses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ flex: 1, minWidth: '200px' }}
                />
                <select className="form-select" value={level} onChange={(e) => { setLevel(e.target.value); setPage(1); }} style={{ width: '180px' }}>
                    <option value="">All Levels</option>
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                </select>
                <button type="submit" className="btn btn-primary">Search</button>
            </form>

            {loading ? (
                <LoadingSpinner />
            ) : courses.length === 0 ? (
                <EmptyState icon="📚" title="No courses found" message="Try adjusting your search or filters" />
            ) : (
                <>
                    <div className="grid-3">
                        {courses.map((course) => (
                            <Link key={course.id} href={`/courses/${course.id}`}>
                                <div className="course-card">
                                    <div className="course-card-image">
                                        {levelEmoji[course.level] || '📘'}
                                    </div>
                                    <div className="course-card-body">
                                        <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>
                                            {course.level}
                                        </span>
                                        <h3 className="course-card-title">{course.title}</h3>
                                        <p className="course-card-desc">{course.description}</p>
                                    </div>
                                    <div className="course-card-footer">
                                        <span>by {course.creator?.name}</span>
                                        <span>{course._count?.modules || 0} modules • {course._count?.enrollments || 0} enrolled</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>← Prev</button>
                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                                Page {page} of {totalPages}
                            </span>
                            <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>Next →</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
