'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, BookOpen, FileText, Video, ClipboardCheck, Layers } from 'lucide-react';
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
    programName: string;
    courses: CourseItem[];
}

interface ProgramGroup {
    programName: string;
    cohorts: { id: string; name: string }[];
    courses: Map<string, { course: CourseItem; cohortIds: string[] }>;
}

export default function MentorProgramsPage() {
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

    // Group by Program
    const programMap = new Map<string, ProgramGroup>();
    cohorts.forEach(c => {
        const key = c.programName || 'Uncategorized';
        if (!programMap.has(key)) {
            programMap.set(key, {
                programName: key,
                cohorts: [],
                courses: new Map(),
            });
        }
        const group = programMap.get(key)!;
        group.cohorts.push({ id: c.id, name: c.name });
        c.courses.forEach(course => {
            const existing = group.courses.get(course.id);
            if (existing) {
                existing.cohortIds.push(c.id);
            } else {
                group.courses.set(course.id, { course, cohortIds: [c.id] });
            }
        });
    });
    const programs = Array.from(programMap.values());

    const actionLinks = (courseId: string, cohortId: string) => [
        { href: `/m/materials?courseId=${courseId}`, icon: FileText, label: 'Materials' },
        { href: `/m/recordings?courseId=${courseId}`, icon: Video, label: 'Recordings' },
        { href: `/m/quizzes?courseId=${courseId}&cohortId=${cohortId}`, icon: ClipboardCheck, label: 'Quizzes' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">My Programs</h1>
                <p className="text-muted-foreground mt-1">Programs from your assigned cohorts</p>
            </div>

            {programs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
                    <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No programs found. Programs will appear once you are assigned to cohorts.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {programs.map((program) => {
                        const courses = Array.from(program.courses.values());
                        return (
                            <div
                                key={program.programName}
                                className="rounded-xl border border-border/50 bg-card overflow-hidden"
                            >
                                {/* Program Header */}
                                <div className="px-5 py-4 border-b border-border/40 bg-gradient-to-r from-primary/5 to-transparent">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <BookOpen className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-foreground">{program.programName}</h2>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Layers className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">
                                                    {program.cohorts.map(c => c.name).join(', ')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Courses List */}
                                <div className="divide-y divide-border/30">
                                    {courses.length === 0 ? (
                                        <p className="px-5 py-4 text-sm text-muted-foreground italic">
                                            No courses assigned to this program yet
                                        </p>
                                    ) : (
                                        courses.map(({ course, cohortIds }) => (
                                            <div
                                                key={course.id}
                                                className="px-5 py-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-7 w-7 rounded-md bg-blue-500/10 flex items-center justify-center">
                                                        <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                                                    </div>
                                                    <span className="text-sm font-medium text-foreground">
                                                        {course.title}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    {actionLinks(course.id, cohortIds[0]).map(link => (
                                                        <Link
                                                            key={link.label}
                                                            href={link.href}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border/60 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
                                                        >
                                                            <link.icon className="h-3 w-3" />
                                                            {link.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
