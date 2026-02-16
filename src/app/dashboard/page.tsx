'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RateStatCard } from '@/components/dashboard/RateStatCard';
import { EngagementChart } from '@/components/dashboard/EngagementChart';
import { RecentActivityTable, type ActivityItem } from '@/components/dashboard/RecentActivityTable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ArrowRight, Filter, Download, Trophy, Loader2 } from 'lucide-react';
import type { PageName } from '@/types';
import { apiClient } from '@/lib/api-client';

interface DashboardSummary {
    users: { total: number; students: number; instructors: number };
    courses: { total: number; published: number };
    enrollments: { total: number };
    submissions: { pending: number; graded: number };
    recentEnrollments: Array<{
        id: string;
        enrolledAt: string;
        user: { name: string; email: string };
        course: { title: string };
    }>;
    enrollmentsByCourse: Array<{
        id: string;
        title: string;
        _count: { enrollments: number };
    }>;
}

// Fallback data for engagement chart (until a dedicated analytics API is built)
const engagementData = [
    { date: 'Jan', value: 65 },
    { date: 'Feb', value: 78 },
    { date: 'Mar', value: 82 },
    { date: 'Apr', value: 75 },
    { date: 'May', value: 90 },
    { date: 'Jun', value: 88 },
    { date: 'Jul', value: 95 },
    { date: 'Aug', value: 92 },
];

export default function DashboardPage() {
    const router = useRouter();
    const [period, setPeriod] = useState('30d');
    const [isLoading, setIsLoading] = useState(true);
    const [summary, setSummary] = useState<DashboardSummary | null>(null);

    const fetchSummary = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await apiClient.get<DashboardSummary>('/api/v1/admin/dashboard/summary');
            setSummary(data);
        } catch (error) {
            console.error('Failed to fetch dashboard summary:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    const handleNavigate = (page: PageName) => {
        router.push(`/${page}`);
    };

    const totalStudents = summary?.users.students ?? 0;
    const totalInstructors = summary?.users.instructors ?? 0;
    const totalCourses = summary?.courses.total ?? 0;
    const publishedCourses = summary?.courses.published ?? 0;
    const totalEnrollments = summary?.enrollments.total ?? 0;
    const pendingSubmissions = summary?.submissions.pending ?? 0;
    const gradedSubmissions = summary?.submissions.graded ?? 0;
    const totalSubmissions = pendingSubmissions + gradedSubmissions;
    const completionRate = totalSubmissions > 0
        ? ((gradedSubmissions / totalSubmissions) * 100).toFixed(1)
        : '0';

    const recentActivities: ActivityItem[] = (summary?.recentEnrollments || []).map((e, i) => ({
        id: e.id || String(i),
        action: `Enrolled in ${e.course?.title || 'a course'}`,
        user: e.user?.name || 'Unknown',
        type: 'Student',
        date: e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString() : '',
        status: 'Completed',
    }));

    const leaderboardData = (summary?.enrollmentsByCourse || []).slice(0, 5).map(c => ({
        name: c.title,
        score: String(c._count.enrollments),
        students: c._count.enrollments,
        badge: null as string | null,
    }));

    return (
        <DashboardLayout
            title="Dashboard"
            subtitle="Overview"
            currentPage="dashboard"
            onNavigate={handleNavigate}
        >
            <div className="space-y-6 pb-8">
                {/* Header with Period Selector */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Welcome back! Here&apos;s what&apos;s happening across your academy.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select
                            options={[
                                { value: '7d', label: 'Last 7 days' },
                                { value: '30d', label: 'Last 30 days' },
                                { value: '90d', label: 'Last 90 days' },
                                { value: '1y', label: 'Last year' },
                            ]}
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                        />
                        <Button variant="outline" size="sm">
                            <Filter className="h-3.5 w-3.5" />
                            Filters
                        </Button>
                        <Button variant="outline" size="sm">
                            <Download className="h-3.5 w-3.5" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <RateStatCard
                                title="Completion Rate"
                                rate={`${completionRate}%`}
                                trend={totalSubmissions > 0 ? '+' : ''}
                                trendUp={Number(completionRate) > 50}
                                metric1Label="Graded"
                                metric1Value={String(gradedSubmissions)}
                                metric2Label="Pending"
                                metric2Value={String(pendingSubmissions)}
                            />
                            <RateStatCard
                                title="Students"
                                rate={String(totalStudents)}
                                trend={totalStudents > 0 ? 'total' : ''}
                                trendUp={totalStudents > 0}
                                metric1Label="Enrollments"
                                metric1Value={String(totalEnrollments)}
                                metric2Label="Courses"
                                metric2Value={String(totalCourses)}
                            />
                            <RateStatCard
                                title="Mentors / Instructors"
                                rate={String(totalInstructors)}
                                trend="active"
                                trendUp={totalInstructors > 0}
                                metric1Label="Published Courses"
                                metric1Value={String(publishedCourses)}
                                metric2Label="Total Courses"
                                metric2Value={String(totalCourses)}
                            />
                            <RateStatCard
                                title="Submissions"
                                rate={String(totalSubmissions)}
                                trend={pendingSubmissions > 0 ? `${pendingSubmissions} pending` : 'all graded'}
                                trendUp={pendingSubmissions === 0}
                                metric1Label="Graded"
                                metric1Value={String(gradedSubmissions)}
                                metric2Label="Pending Review"
                                metric2Value={String(pendingSubmissions)}
                            />
                        </div>

                        {/* Chart & Top Courses */}
                        <div className="grid gap-6 lg:grid-cols-3 h-[400px]">
                            <div className="lg:col-span-2">
                                <EngagementChart data={engagementData} title="Student Engagement Trends" />
                            </div>
                            <Card className="flex flex-col">
                                <CardHeader className="flex flex-row items-center justify-between pb-3">
                                    <CardTitle className="flex items-center gap-2">
                                        <Trophy className="h-4 w-4 text-yellow-500" />
                                        Top Courses
                                    </CardTitle>
                                    <button
                                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                                        onClick={() => handleNavigate('programs' as PageName)}
                                    >
                                        View All
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </button>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-y-auto space-y-3">
                                    {leaderboardData.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No course data yet.
                                        </p>
                                    ) : (
                                        leaderboardData.map((course, index) => (
                                            <div
                                                key={course.name + index}
                                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer"
                                            >
                                                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-xs font-bold text-muted-foreground">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">
                                                        {course.name}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {course.students} enrollments
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {course.score}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Activity */}
                        {recentActivities.length > 0 ? (
                            <RecentActivityTable activities={recentActivities} />
                        ) : (
                            <Card>
                                <CardContent className="py-8">
                                    <p className="text-sm text-muted-foreground text-center">
                                        No recent activity yet. Enrollments will appear here.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
