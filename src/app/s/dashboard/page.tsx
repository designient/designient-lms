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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAll() {
            const [coursesRes, gradesRes, submissionsRes] = await Promise.all([
                api.get<{ courses: EnrolledCourse[] }>('/me/courses?limit=50'),
                api.get<{ grades: Grade[] }>('/me/grades?limit=10'),
                api.get<{ submissions: Submission[] }>('/me/submissions?limit=10'),
            ]);

            if (coursesRes.success && coursesRes.data) setCourses(coursesRes.data.courses);
            if (gradesRes.success && gradesRes.data) setGrades(gradesRes.data.grades);
            if (submissionsRes.success && submissionsRes.data) setSubmissions(submissionsRes.data.submissions);
            setLoading(false);
        }
        fetchAll();
    }, []);

    const totalLessons = courses.reduce((sum, c) => sum + c.totalLessons, 0);
    const completedLessons = courses.reduce((sum, c) => sum + c.completedLessons, 0);
    const averageProgress =
        courses.length > 0
            ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length)
            : 0;
    const averageGrade =
        grades.length > 0
            ? Math.round(
                  grades.reduce(
                      (sum, g) => sum + (g.score / g.submission.assignment.maxScore) * 100,
                      0
                  ) / grades.length
              )
            : 0;
    const pendingSubmissions = submissions.filter((s) => !s.grade).length;

    const firstName = session?.user?.name?.split(' ')[0] || 'Student';

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">
                    Welcome back, {firstName}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Here&apos;s an overview of your learning progress.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={BookOpen}
                    label="Enrolled Courses"
                    value={courses.length}
                    sub={`${courses.filter((c) => c.progress === 100).length} completed`}
                    color="text-blue-500"
                    bgColor="bg-blue-500/10"
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Lessons Completed"
                    value={completedLessons}
                    sub={`of ${totalLessons} total`}
                    color="text-emerald-500"
                    bgColor="bg-emerald-500/10"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Average Progress"
                    value={`${averageProgress}%`}
                    sub="across all courses"
                    color="text-violet-500"
                    bgColor="bg-violet-500/10"
                />
                <StatCard
                    icon={Trophy}
                    label="Average Grade"
                    value={grades.length > 0 ? `${averageGrade}%` : '—'}
                    sub={
                        pendingSubmissions > 0
                            ? `${pendingSubmissions} pending review`
                            : `${grades.length} graded`
                    }
                    color="text-amber-500"
                    bgColor="bg-amber-500/10"
                />
            </div>

            {/* Active Courses */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">
                        Active Courses
                    </h2>
                    <Link
                        href="/s/courses"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                        View all <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
                {courses.length === 0 ? (
                    <div className="rounded-xl border border-border/50 bg-card p-8 text-center">
                        <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                            No courses yet.{' '}
                            <Link href="/s/catalog" className="text-primary hover:underline">
                                Browse the catalog
                            </Link>{' '}
                            to enroll.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {courses
                            .filter((c) => c.progress < 100)
                            .slice(0, 6)
                            .map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/s/courses/${item.course.id}/learn`}
                                    className="group"
                                >
                                    <div className="rounded-xl border border-border/50 bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all">
                                        <div className="flex items-start justify-between mb-3">
                                            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                                                {item.course.level}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {item.completedLessons}/{item.totalLessons} lessons
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">
                                            {item.course.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mb-3">
                                            by {item.course.creator?.name}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-primary transition-all"
                                                    style={{
                                                        width: `${item.progress}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {item.progress}%
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                    </div>
                )}
            </section>

            {/* Recent Activity Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Grades */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground">
                            Recent Grades
                        </h2>
                        <Link
                            href="/s/grades"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                            View all <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/50">
                        {grades.length === 0 ? (
                            <div className="p-6 text-center">
                                <BarChart3 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    No grades yet
                                </p>
                            </div>
                        ) : (
                            grades.slice(0, 5).map((grade) => {
                                const pct =
                                    (grade.score /
                                        grade.submission.assignment.maxScore) *
                                    100;
                                return (
                                    <div
                                        key={grade.id}
                                        className="flex items-center justify-between px-4 py-3"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {grade.submission.assignment.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                by {grade.grader.name} &middot;{' '}
                                                {new Date(
                                                    grade.gradedAt
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span
                                            className={`text-sm font-semibold ${
                                                pct >= 90
                                                    ? 'text-emerald-500'
                                                    : pct >= 70
                                                      ? 'text-blue-500'
                                                      : pct >= 50
                                                        ? 'text-amber-500'
                                                        : 'text-destructive'
                                            }`}
                                        >
                                            {grade.score}/
                                            {grade.submission.assignment.maxScore}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>

                {/* Pending Assignments */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground">
                            Recent Submissions
                        </h2>
                        <Link
                            href="/s/assignments"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                            View all <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/50">
                        {submissions.length === 0 ? (
                            <div className="p-6 text-center">
                                <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    No submissions yet
                                </p>
                            </div>
                        ) : (
                            submissions.slice(0, 5).map((sub) => (
                                <div
                                    key={sub.id}
                                    className="flex items-center justify-between px-4 py-3"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {sub.assignment.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3 inline mr-1" />
                                            {new Date(
                                                sub.submittedAt
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {sub.grade ? (
                                        <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                                            Graded: {sub.grade.score}/{sub.assignment.maxScore}
                                        </span>
                                    ) : (
                                        <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                                            Pending
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </section>
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
