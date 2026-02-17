'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
    BookOpen,
    FileText,
    BarChart3,
    Clock,
    CheckCircle2,
    ArrowRight,
    Trophy,
    TrendingUp,
} from 'lucide-react';
import { api } from '@/lib/api';

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

interface Grade {
    id: string;
    score: number;
    gradedAt: string;
    grader: { name: string };
    submission: {
        assignment: { title: string; maxScore: number };
    };
}

interface Submission {
    id: string;
    submittedAt: string;
    assignment: { title: string; maxScore: number };
    grade: { score: number } | null;
}

export default function StudentDashboard() {
    const { data: session } = useSession();
    const [courses, setCourses] = useState<EnrolledCourse[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [cohortInfo, setCohortInfo] = useState<{ name: string; program?: string; startDate: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAll() {
            const [coursesRes, gradesRes, submissionsRes, profileRes] = await Promise.all([
                api.get<{ courses: EnrolledCourse[] }>('/me/courses?limit=50'),
                api.get<{ grades: Grade[] }>('/me/grades?limit=10'),
                api.get<{ submissions: Submission[] }>('/me/submissions?limit=10'),
                api.get<any>('/me/profile'),
            ]);

            if (coursesRes.success && coursesRes.data) setCourses(coursesRes.data.courses);
            if (gradesRes.success && gradesRes.data) setGrades(gradesRes.data.grades);
            if (submissionsRes.success && submissionsRes.data) setSubmissions(submissionsRes.data.submissions);
            if (profileRes.success && profileRes.data?.studentProfile?.cohort) {
                setCohortInfo({
                    name: profileRes.data.studentProfile.cohort.name,
                    program: profileRes.data.studentProfile.cohort.program?.name,
                    startDate: profileRes.data.studentProfile.cohort.startDate,
                });
            }
            setLoading(false);
        }
        fetchAll();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    const firstName = session?.user?.name?.split(' ')[0] || 'Student';

    return (
        <div className="space-y-8">
            {/* Header with Context */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Hello, {firstName}! 👋
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        {cohortInfo ? (
                            <>
                                You are part of <span className="font-semibold text-foreground">{cohortInfo.name}</span>
                                {cohortInfo.program && <> in the <span className="font-semibold text-foreground">{cohortInfo.program}</span></>}
                            </>
                        ) : (
                            'Welcome to your learning dashboard.'
                        )}
                    </p>
                </div>
                <div className="hidden md:block text-right">
                    <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={BookOpen}
                    label="Enrolled Courses"
                    value={courses.length}
                    sub="Active courses"
                    color="text-blue-600"
                    bgColor="bg-blue-500/10"
                />
                <StatCard
                    icon={Trophy}
                    label="Assignments"
                    value={submissions.length}
                    sub="Submitted"
                    color="text-amber-600"
                    bgColor="bg-amber-500/10"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Average Grade"
                    value={`${grades.length > 0 ? Math.round(grades.reduce((acc, g) => acc + (g.score / g.submission.assignment.maxScore) * 100, 0) / grades.length) : 0}%`}
                    sub=" across assignments"
                    color="text-emerald-600"
                    bgColor="bg-emerald-500/10"
                />
                <StatCard
                    icon={Clock}
                    label="Learning Time"
                    value="12h"
                    sub="This week"
                    color="text-violet-600"
                    bgColor="bg-violet-500/10"
                />
            </div>

            {/* Continue Learning */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Continue Learning</h2>
                    <Link href="/s/courses" className="text-sm text-primary hover:underline">
                        View All
                    </Link>
                </div>
                {courses.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/60 p-8 text-center">
                        <p className="text-muted-foreground">
                            You haven't enrolled in any courses yet.
                        </p>
                        <Link
                            href="/s/catalog"
                            className="inline-block mt-2 text-primary hover:underline"
                        >
                            Browse Catalog
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {courses.slice(0, 3).map((item) => (
                            <Link
                                key={item.id}
                                href={`/s/courses/${item.course.id}/learn`}
                                className="group"
                            >
                                <div className="rounded-xl border border-border/50 bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all h-full flex flex-col">
                                    <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
                                        {item.course.title}
                                    </h3>
                                    <div className="mt-auto pt-3">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                                            <span>Progress</span>
                                            <span className="font-medium">
                                                {item.progress}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${item.progress === 100
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Grades */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground">Recent Grades</h2>
                        <Link href="/s/grades" className="text-sm text-primary hover:underline">
                            View All
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {grades.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No grades yet.</p>
                        ) : (
                            grades.map((grade) => (
                                <div key={grade.id} className="rounded-xl border border-border/50 bg-card p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-sm text-foreground">{grade.submission.assignment.title}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(grade.gradedAt).toLocaleDateString()}</p>
                                    </div>
                                    <span className="font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg text-sm">
                                        {grade.score} / {grade.submission.assignment.maxScore}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Submissions */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground">Recent Submissions</h2>
                        <Link href="/s/assignments" className="text-sm text-primary hover:underline">
                            View All
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {submissions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No submissions yet.</p>
                        ) : (
                            submissions.map((sub) => (
                                <div key={sub.id} className="rounded-xl border border-border/50 bg-card p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-sm text-foreground">{sub.assignment.title}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(sub.submittedAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {sub.grade ? (
                                            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                                                <CheckCircle2 className="h-3 w-3" /> Graded
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">
                                                <Clock className="h-3 w-3" /> Pending
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    color,
    bgColor,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    sub: string;
    color: string;
    bgColor: string;
}) {
    return (
        <div className="rounded-xl border border-border/50 bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
                <div
                    className={`h-9 w-9 rounded-lg ${bgColor} flex items-center justify-center`}
                >
                    <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {label}
                </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        </div>
    );
}
