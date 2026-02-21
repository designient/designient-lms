'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, BookOpen, FileText, Video, ClipboardCheck, Layers, ListOrdered, ListChecks, Hammer } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface ProgramCourse {
    id: string;
    title: string;
    slug: string;
}

interface CohortWithProgram {
    id: string;
    name: string;
    programName: string;
    courses: ProgramCourse[];
}

interface ProgramGroup {
    programName: string;
    cohorts: { id: string; name: string }[];
    courseId: string | null;
    courseTitle: string | null;
}

export default function MentorProgramsPage() {
    const [cohorts, setCohorts] = useState<CohortWithProgram[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        apiClient.get<{ cohorts: CohortWithProgram[] }>('/api/v1/instructor/cohorts')
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
            // Use the first course as the program's backing course
            const firstCourse = c.courses.length > 0 ? c.courses[0] : null;
            programMap.set(key, {
                programName: key,
                cohorts: [],
                courseId: firstCourse?.id || null,
                courseTitle: firstCourse?.title || null,
            });
        }
        const group = programMap.get(key)!;
        group.cohorts.push({ id: c.id, name: c.name });
        // If we didn't get a courseId yet, try from this cohort
        if (!group.courseId && c.courses.length > 0) {
            group.courseId = c.courses[0].id;
            group.courseTitle = c.courses[0].title;
        }
    });
    const programs = Array.from(programMap.values());

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
                    {programs.map((program) => (
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
                                                Cohorts: {program.cohorts.map(c => c.name).join(', ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Program Actions */}
                            <div className="p-5">
                                {program.courseId ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                                        <Link
                                            href={`/m/syllabus/${program.courseId}`}
                                            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60 hover:bg-muted/30 hover:border-primary/30 transition-colors group"
                                        >
                                            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                                <Hammer className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <span className="text-sm font-medium text-foreground group-hover:text-primary">Manage Syllabus</span>
                                            <span className="text-xs text-muted-foreground">Draft and submit</span>
                                        </Link>
                                        <Link
                                            href={`/m/materials?courseId=${program.courseId}`}
                                            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60 hover:bg-muted/30 hover:border-primary/30 transition-colors group"
                                        >
                                            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                <FileText className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <span className="text-sm font-medium text-foreground group-hover:text-primary">Materials</span>
                                            <span className="text-xs text-muted-foreground">Study resources</span>
                                        </Link>
                                        <Link
                                            href={`/m/recordings?courseId=${program.courseId}`}
                                            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60 hover:bg-muted/30 hover:border-primary/30 transition-colors group"
                                        >
                                            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                                <Video className="h-5 w-5 text-red-600" />
                                            </div>
                                            <span className="text-sm font-medium text-foreground group-hover:text-primary">Recordings</span>
                                            <span className="text-xs text-muted-foreground">Class recordings</span>
                                        </Link>
                                        <Link
                                            href={`/m/quizzes?cohortId=${program.cohorts[0]?.id}`}
                                            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60 hover:bg-muted/30 hover:border-primary/30 transition-colors group"
                                        >
                                            <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                                <ClipboardCheck className="h-5 w-5 text-violet-600" />
                                            </div>
                                            <span className="text-sm font-medium text-foreground group-hover:text-primary">Quizzes</span>
                                            <span className="text-xs text-muted-foreground">Assessments</span>
                                        </Link>
                                        <Link
                                            href={`/m/attendance?cohortId=${program.cohorts[0]?.id}`}
                                            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60 hover:bg-muted/30 hover:border-primary/30 transition-colors group"
                                        >
                                            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                <ListOrdered className="h-5 w-5 text-emerald-600" />
                                            </div>
                                            <span className="text-sm font-medium text-foreground group-hover:text-primary">Attendance</span>
                                            <span className="text-xs text-muted-foreground">Track sessions</span>
                                        </Link>
                                        <Link
                                            href={program.courseId ? `/m/assignments?courseId=${program.courseId}` : '/m/assignments'}
                                            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60 hover:bg-muted/30 hover:border-primary/30 transition-colors group"
                                        >
                                            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                                <ListChecks className="h-5 w-5 text-amber-600" />
                                            </div>
                                            <span className="text-sm font-medium text-foreground group-hover:text-primary">Assignments</span>
                                            <span className="text-xs text-muted-foreground">Create & tasks</span>
                                        </Link>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">
                                        Program syllabus is being set up by the admin. Content will appear here once configured.
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
