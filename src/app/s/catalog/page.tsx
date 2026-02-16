'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Search, Filter, CheckCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Course {
    id: string;
    title: string;
    slug: string;
    description: string;
    level: string;
    creator: { name: string };
    _count: { modules: number; enrollments: number };
}

const levelConfig: Record<string, { emoji: string; color: string }> = {
    BEGINNER: { emoji: '🟢', color: 'text-emerald-600 bg-emerald-500/10' },
    INTERMEDIATE: { emoji: '🟡', color: 'text-amber-600 bg-amber-500/10' },
    ADVANCED: { emoji: '🔴', color: 'text-red-600 bg-red-500/10' },
};

export default function StudentCatalogPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [courses, setCourses] = useState<Course[]>([]);
    const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [level, setLevel] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [enrolling, setEnrolling] = useState<string | null>(null);

    const fetchCourses = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('page', String(page));
        if (search) params.set('search', search);
        if (level) params.set('level', level);

        const res = await api.get<{
            courses: Course[];
            pagination: { totalPages: number };
        }>(`/courses?${params}`);
        if (res.success && res.data) {
            setCourses(res.data.courses);
            setTotalPages(res.data.pagination.totalPages);
        }
        setLoading(false);
    };

    const fetchEnrolledIds = async () => {
        const res = await api.get<{ courses: Array<{ course: { id: string } }> }>('/me/courses?limit=200');
        if (res.success && res.data) {
            setEnrolledIds(new Set(res.data.courses.map(c => c.course.id)));
        }
    };

    const handleEnroll = async (courseId: string) => {
        setEnrolling(courseId);
        try {
            const res = await api.post(`/courses/${courseId}/enroll`);
            if (res.success) {
                setEnrolledIds(prev => new Set([...prev, courseId]));
                toast({ title: 'Enrolled!', description: 'You have been enrolled in this course.', variant: 'success' });
            } else {
                toast({ title: 'Error', description: 'Failed to enroll. Please try again.', variant: 'error' });
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to enroll.', variant: 'error' });
        } finally {
            setEnrolling(null);
        }
    };

    useEffect(() => {
        fetchCourses();
        fetchEnrolledIds();
    }, [page, level]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchCourses();
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Course Catalog</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Discover expert-led courses and start learning
                </p>
            </div>

            {/* Search & Filter */}
            <form onSubmit={handleSearch} className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        className="w-full rounded-lg border border-border/60 bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Search courses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <select
                        className="appearance-none rounded-lg border border-border/60 bg-background pl-8 pr-8 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={level}
                        onChange={(e) => {
                            setLevel(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">All Levels</option>
                        <option value="BEGINNER">Beginner</option>
                        <option value="INTERMEDIATE">Intermediate</option>
                        <option value="ADVANCED">Advanced</option>
                    </select>
                </div>
                <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                    Search
                </button>
            </form>

            {/* Results */}
            {loading ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
            ) : courses.length === 0 ? (
                <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
                    <Search className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                        No courses found
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Try adjusting your search or filters.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {courses.map((course) => {
                            const config = levelConfig[course.level] || {
                                emoji: '📘',
                                color: 'text-muted-foreground bg-muted/50',
                            };
                            const isEnrolled = enrolledIds.has(course.id);
                            return (
                                <div
                                    key={course.id}
                                    className="group rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-sm transition-all h-full flex flex-col overflow-hidden"
                                >
                                    <Link href={`/s/courses/${course.id}/learn`}>
                                        <div className="h-32 bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center text-4xl">
                                            {config.emoji}
                                        </div>
                                    </Link>
                                    <div className="p-4 flex-1 flex flex-col">
                                        <div className="flex items-center justify-between mb-2">
                                            <span
                                                className={`text-[10px] font-medium uppercase tracking-wider ${config.color} px-2 py-0.5 rounded`}
                                            >
                                                {course.level}
                                            </span>
                                            {isEnrolled && (
                                                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                                                    <CheckCircle className="h-3 w-3" /> Enrolled
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">
                                            {course.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground line-clamp-2 flex-1 mb-3">
                                            {course.description}
                                        </p>
                                        <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/30 pt-3 mb-3">
                                            <span>by {course.creator?.name}</span>
                                            <span>
                                                {course._count?.modules || 0} modules •{' '}
                                                {course._count?.enrollments || 0} enrolled
                                            </span>
                                        </div>
                                        {isEnrolled ? (
                                            <Link
                                                href={`/s/courses/${course.id}/learn`}
                                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                                            >
                                                Continue Learning <ArrowRight className="h-3 w-3" />
                                            </Link>
                                        ) : (
                                            <button
                                                onClick={() => handleEnroll(course.id)}
                                                disabled={enrolling === course.id}
                                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-primary text-primary text-xs font-medium hover:bg-primary/10 transition-colors disabled:opacity-50"
                                            >
                                                {enrolling === course.id ? 'Enrolling...' : 'Enroll Now'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 pt-4">
                            <button
                                onClick={() => setPage((p) => p - 1)}
                                disabled={page <= 1}
                                className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                ← Previous
                            </button>
                            <span className="text-xs text-muted-foreground">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= totalPages}
                                className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
