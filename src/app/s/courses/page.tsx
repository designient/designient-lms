'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { BookOpen, Layers } from 'lucide-react';

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
        program?: { id: string; name: string } | null;
        modules?: Array<{ id: string; title: string; lessonCount: number }>;
    };
    progress: number;
    totalLessons: number;
    completedLessons: number;
    cohort?: { id: string; name: string; program?: { id: string; name: string } | null } | null;
}

interface ProgramGroup {
    key: string;
    programName: string;
    cohortName: string | null;
    items: EnrolledCourse[];
}

export default function StudentCoursesPage() {
    const [courses, setCourses] = useState<EnrolledCourse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ courses: EnrolledCourse[] }>('/me/courses?limit=100').then((res) => {
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

    const groupsMap = new Map<string, ProgramGroup>();
    courses.forEach((item) => {
        const programName =
            item.course.program?.name ||
            item.cohort?.program?.name ||
            'Independent Learning';
        const cohortName = item.cohort?.name || null;
        const key = `${programName}::${cohortName || ''}`;
        if (!groupsMap.has(key)) {
            groupsMap.set(key, { key, programName, cohortName, items: [] });
        }
        groupsMap.get(key)!.items.push(item);
    });
    const programGroups = Array.from(groupsMap.values());

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">My Programs</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    View your program syllabus and continue learning
                </p>
            </div>

            {programGroups.length === 0 ? (
                <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No program syllabus assigned</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Your mentor or admin can assign your program syllabus.
                    </p>
                    <Link
                        href="/s/catalog"
                        className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        Browse Catalog
                    </Link>
                </div>
            ) : (
                <div className="space-y-5">
                    {programGroups.map((group) => (
                        <div key={group.key} className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">{group.programName}</h2>
                                    <p className="text-xs text-muted-foreground">
                                        {group.cohortName ? `Cohort: ${group.cohortName}` : 'Self-paced'}
                                    </p>
                                </div>
                                <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                                    {group.items.length} course{group.items.length === 1 ? '' : 's'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {group.items.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/s/courses/${item.course.id}/learn`}
                                        className="rounded-xl border border-border/50 p-4 hover:border-primary/30 hover:bg-muted/20 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="text-sm font-semibold text-foreground line-clamp-2">{item.course.title}</h3>
                                            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                                                {item.course.level}
                                            </span>
                                        </div>

                                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                                            {item.course.description}
                                        </p>

                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                            <Layers className="h-3.5 w-3.5" />
                                            <span>
                                                {(item.course.modules || []).length} modules • {item.totalLessons} lessons
                                            </span>
                                        </div>

                                        {(item.course.modules || []).length > 0 && (
                                            <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                                                {(item.course.modules || []).slice(0, 3).map((module) => (
                                                    <li key={module.id} className="truncate">
                                                        • {module.title} ({module.lessonCount})
                                                    </li>
                                                ))}
                                                {(item.course.modules || []).length > 3 && (
                                                    <li>• +{(item.course.modules || []).length - 3} more modules</li>
                                                )}
                                            </ul>
                                        )}

                                        <div>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                                <span>{item.completedLessons}/{item.totalLessons} lessons</span>
                                                <span className="font-medium">{item.progress}%</span>
                                            </div>
                                            <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${item.progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                                                    style={{ width: `${item.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
