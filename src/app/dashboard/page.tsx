'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RateStatCard } from '@/components/dashboard/RateStatCard';
import { EngagementChart } from '@/components/dashboard/EngagementChart';
import { RecentActivityTable, type ActivityItem } from '@/components/dashboard/RecentActivityTable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowRight, Layers, Loader2 } from 'lucide-react';
import type { PageName } from '@/types';
import { apiClient } from '@/lib/api-client';

interface DashboardSummary {
    programs: { total: number; active: number };
    cohorts: { total: number; active: number; upcoming: number };
    students: {
        total: number;
        active: number;
        invited: number;
        flagged: number;
        dropped: number;
        completed: number;
    };
    mentors: { total: number; active: number };
    topCohorts: Array<{
        name: string;
        programName: string;
        studentCount: number;
        capacity: number;
    }>;
    recentStudents: Array<{
        id: string;
        name: string;
        email: string;
        cohortName: string;
        enrollmentDate: string;
        status: string;
    }>;
    enrollmentTrend: Array<{ month: string; count: number }>;
}

export default function DashboardPage() {
    const router = useRouter();
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

    // Derived values
    const students = summary?.students ?? { total: 0, active: 0, invited: 0, flagged: 0, dropped: 0, completed: 0 };
    const cohorts = summary?.cohorts ?? { total: 0, active: 0, upcoming: 0 };
    const mentors = summary?.mentors ?? { total: 0, active: 0 };
    const programs = summary?.programs ?? { total: 0, active: 0 };

    const completionRate = students.total > 0
        ? ((students.completed / students.total) * 100).toFixed(1)
        : '0';

    // Map enrollment trend to chart format
    const chartData = (summary?.enrollmentTrend || []).map(t => ({
        date: t.month,
        value: t.count,
    }));

    // Map recent students to activity items
    const recentActivities: ActivityItem[] = (summary?.recentStudents || []).map(s => ({
        id: s.id,
        action: `Enrolled in ${s.cohortName}`,
        user: s.name,
        type: 'Student' as const,
        date: new Date(s.enrollmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: (s.status === 'ACTIVE' || s.status === 'COMPLETED' ? 'Completed' : s.status === 'INVITED' ? 'Pending' : 'Failed') as ActivityItem['status'],
    }));

    return (
        <DashboardLayout
            title="Dashboard"
            subtitle="Overview"
            currentPage="dashboard"
            onNavigate={handleNavigate}
        >
            <div className="space-y-6 pb-8">
                {/* Header */}
                <div>
                    <p className="text-sm text-muted-foreground">
                        Welcome back! Here&apos;s what&apos;s happening across your academy.
                    </p>
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
                                title="Active Students"
                                rate={String(students.active)}
                                trend={students.total > 0 ? `of ${students.total}` : ''}
                                trendUp={students.active > 0}
                                metric1Label="Total"
                                metric1Value={String(students.total)}
                                metric2Label="Flagged"
                                metric2Value={String(students.flagged)}
                                onClick={() => handleNavigate('students')}
                            />
                            <RateStatCard
                                title="Active Cohorts"
                                rate={String(cohorts.active)}
                                trend={cohorts.upcoming > 0 ? `${cohorts.upcoming} upcoming` : ''}
                                trendUp={cohorts.active > 0}
                                metric1Label="Upcoming"
                                metric1Value={String(cohorts.upcoming)}
                                metric2Label="Programs"
                                metric2Value={String(programs.total)}
                                onClick={() => handleNavigate('cohorts')}
                            />
                            <RateStatCard
                                title="Mentors"
                                rate={String(mentors.active)}
                                trend={mentors.total > 0 ? `of ${mentors.total}` : ''}
                                trendUp={mentors.active > 0}
                                metric1Label="Total"
                                metric1Value={String(mentors.total)}
                                metric2Label="Active"
                                metric2Value={String(mentors.active)}
                                onClick={() => handleNavigate('mentors')}
                            />
                            <RateStatCard
                                title="Completion Rate"
                                rate={`${completionRate}%`}
                                trend={students.completed > 0 ? `${students.completed} completed` : ''}
                                trendUp={Number(completionRate) > 0}
                                metric1Label="Completed"
                                metric1Value={String(students.completed)}
                                metric2Label="Dropped"
                                metric2Value={String(students.dropped)}
                            />
                        </div>

                        {/* Chart & Top Cohorts */}
                        <div className="grid gap-6 lg:grid-cols-3 h-[400px]">
                            <div className="lg:col-span-2">
                                <EngagementChart
                                    data={chartData.length > 0 ? chartData : [{ date: '-', value: 0 }]}
                                    title="Student Enrollments (Last 6 Months)"
                                />
                            </div>
                            <Card className="flex flex-col">
                                <CardHeader className="flex flex-row items-center justify-between pb-3">
                                    <CardTitle className="flex items-center gap-2">
                                        <Layers className="h-4 w-4 text-primary" />
                                        Top Cohorts
                                    </CardTitle>
                                    <button
                                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                                        onClick={() => handleNavigate('cohorts')}
                                    >
                                        View All
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </button>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-y-auto space-y-3">
                                    {(summary?.topCohorts || []).length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No cohort data yet.
                                        </p>
                                    ) : (
                                        (summary?.topCohorts || []).map((cohort, index) => (
                                            <div
                                                key={cohort.name + index}
                                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer"
                                                onClick={() => handleNavigate('cohorts')}
                                            >
                                                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-xs font-bold text-muted-foreground">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">
                                                        {cohort.name}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {cohort.programName}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {cohort.studentCount}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        / {cohort.capacity}
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
                                        No recent activity yet. Student enrollments will appear here.
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
