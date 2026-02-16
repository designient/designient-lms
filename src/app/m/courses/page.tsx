'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface CourseItem {
    id: string;
    title: string;
    slug: string;
}

interface CohortWithCourses {
    id: string;
    name: string;
    courses: CourseItem[];
}

export default function MentorCoursesPage() {
    const [cohorts, setCohorts] = useState<CohortWithCourses[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        apiClient.get<{ cohorts: CohortWithCourses[] }>('/api/v1/instructor/cohorts')
            .then(res => setCohorts(res.cohorts))
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Flatten courses from all cohorts (deduplicate)
    const courseMap = new Map<string, { course: CourseItem; cohortNames: string[] }>();
    cohorts.forEach(c => {
        c.courses.forEach(course => {
            const existing = courseMap.get(course.id);
            if (existing) {
                existing.cohortNames.push(c.name);
            } else {
                courseMap.set(course.id, { course, cohortNames: [c.name] });
            }
        });
    });
    const allCourses = Array.from(courseMap.values());

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
                <p className="text-muted-foreground mt-1">Courses from your assigned cohorts</p>
            </div>

            {allCourses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
                    <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No courses found. Courses will appear once assigned to your cohorts.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allCourses.map(({ course, cohortNames }) => (
                        <div
                            key={course.id}
                            className="rounded-xl border border-border/50 bg-card p-5 space-y-3"
                        >
                            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <BookOpen className="h-4 w-4 text-blue-600" />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">{course.title}</h3>
                            <p className="text-xs text-muted-foreground">
                                Cohorts: {cohortNames.join(', ')}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
