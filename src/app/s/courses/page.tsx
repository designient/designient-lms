'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { BookOpen } from 'lucide-react';

interface EnrolledCourse {
    id: string;
    enrolledAt: string;
    course: {
        id: string;
        title: string;
        slug: string;
        description: string;
        level: string;
        creator: { name: string };
    };
    progress: number;
    totalLessons: number;
    completedLessons: number;
}

export default function StudentCoursesPage() {
    const [courses, setCourses] = useState<EnrolledCourse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ courses: EnrolledCourse[] }>('/me/courses?limit=50').then((res) => {
            if (res.success && res.data) setCourses(res.data.courses);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Continue learning where you left off
                </p>
            </div>

            {courses.length === 0 ? (
                <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No courses yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Browse the catalog and enroll in a course to get started.
                    </p>
                    <Link
                        href="/s/catalog"
                        className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        Browse Catalog
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map((item) => (
                        <Link
                            key={item.id}
                            href={`/s/courses/${item.course.id}/learn`}
                            className="group"
                        >
                            <div className="rounded-xl border border-border/50 bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all h-full flex flex-col">
                                <div className="flex items-start justify-between mb-3">
                                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                                        {item.course.level}
                                    </span>
                                    {item.progress === 100 && (
                                        <span className="text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                                            Completed
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">
                                    {item.course.title}
                                </h3>
                                <p className="text-xs text-muted-foreground mb-1 line-clamp-2 flex-1">
                                    {item.course.description}
                                </p>
                                <p className="text-xs text-muted-foreground mb-3">
                                    by {item.course.creator?.name}
                                </p>
                                <div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                                        <span>
                                            {item.completedLessons} / {item.totalLessons} lessons
                                        </span>
                                        <span className="font-medium">{item.progress}%</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${
                                                item.progress === 100
                                                    ? 'bg-emerald-500'
                                                    : 'bg-primary'
                                            }`}
                                            style={{ width: `${item.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
