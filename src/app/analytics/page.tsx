'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageName } from '@/types';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/dashboard/StatCard';
import {
    TrendingUp,
    Users,
    Target,
    Star,
    IndianRupee,
    CheckCircle,
    Clock,
    AlertCircle,
    BarChart3,
    PieChart,
    Calendar,
    Award,
    Loader2,
    Info
} from 'lucide-react';
import { CohortAnalytics, MentorAnalytics, RevenueData } from '@/types';
import { apiClient } from '@/lib/api-client';

type AnalyticsTab = 'overview' | 'cohorts' | 'mentors' | 'revenue';

export default function AnalyticsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
    const [isLoading, setIsLoading] = useState(true);

    const [cohortAnalytics, setCohortAnalytics] = useState<CohortAnalytics[]>([]);
    const [mentorAnalytics, setMentorAnalytics] = useState<MentorAnalytics[]>([]);
    const [studentFunnel, setStudentFunnel] = useState<{ status: string; count: number; color: string }[]>([]);
    const [totalStudents, setTotalStudents] = useState(0);
    const [totalMentors, setTotalMentors] = useState(0);
    const [totalCohorts, setTotalCohorts] = useState(0);

    const fetchAnalyticsData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [cohortsRes, mentorsRes, studentsRes] = await Promise.all([
                apiClient.get<{ cohorts: Array<{ id: string; name: string; status: string; capacity: number; _count?: { students: number } }> }>('/api/v1/cohorts?limit=50').catch(() => ({ cohorts: [] })),
                apiClient.get<{ mentors: Array<{ id: string; name: string; email: string; rating?: number; cohortCount?: number; maxCohorts?: number; status: string }> }>('/api/v1/mentors?limit=50').catch(() => ({ mentors: [] })),
                apiClient.get<{ students: Array<{ id: string; name: string; status: string }>, pagination: { total: number } }>('/api/v1/students?limit=50').catch(() => ({ students: [], pagination: { total: 0 } })),
            ]);

            setTotalCohorts(cohortsRes.cohorts.length);
            setTotalMentors(mentorsRes.mentors.length);
            setTotalStudents(studentsRes.pagination?.total ?? studentsRes.students.length);

            // Build cohort analytics from real data
            const cohortData: CohortAnalytics[] = cohortsRes.cohorts.map(c => ({
                cohortId: c.id,
                cohortName: c.name,
                totalStudents: c._count?.students ?? 0,
                completionRate: c.status === 'COMPLETED' ? 100 : 0,
                averageProgress: c.status === 'COMPLETED' ? 100 : c.status === 'ACTIVE' ? 50 : 0,
                dropoutRate: 0,
                averageRating: 0,
            }));
            setCohortAnalytics(cohortData);

            // Build mentor analytics from real data
            const mentorData: MentorAnalytics[] = mentorsRes.mentors.map(m => ({
                mentorId: m.id,
                mentorName: m.name,
                rating: m.rating ?? 0,
                totalSessions: 0,
                completedSessions: 0,
                studentsSatisfaction: 0,
                activeStudents: m.cohortCount ?? 0,
            }));
            setMentorAnalytics(mentorData);

            // Build student funnel from status counts
            const statusCounts: Record<string, number> = {};
            for (const s of studentsRes.students) {
                const mapped = ({ INVITED: 'Invited', ACTIVE: 'Active', FLAGGED: 'Flagged', DROPPED: 'Dropped', COMPLETED: 'Completed' } as Record<string, string>)[s.status] || s.status;
                statusCounts[mapped] = (statusCounts[mapped] || 0) + 1;
            }
            const colorMap: Record<string, string> = { Invited: 'bg-muted-foreground', Active: 'bg-emerald-500', Flagged: 'bg-amber-500', Completed: 'bg-blue-500', Dropped: 'bg-red-500' };
            const funnel = ['Invited', 'Active', 'Flagged', 'Completed', 'Dropped'].map(status => ({
                status,
                count: statusCounts[status] || 0,
                color: colorMap[status] || 'bg-muted-foreground',
            }));
            setStudentFunnel(funnel);
        } catch (error) {
            console.error('Failed to fetch analytics data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalyticsData();
    }, [fetchAnalyticsData]);

    const handleNavigate = (page: PageName) => {
        router.push(`/${page}`);
    };

    const tabs: {
        id: AnalyticsTab;
        label: string;
        icon: any;
    }[] = [
            {
                id: 'overview',
                label: 'Overview',
                icon: PieChart
            },
            {
                id: 'cohorts',
                label: 'Cohorts',
                icon: BarChart3
            },
            {
                id: 'mentors',
                label: 'Mentors',
                icon: Users
            },
            {
                id: 'revenue',
                label: 'Revenue',
                icon: IndianRupee
            }
        ];

    const maxFunnelCount = Math.max(1, ...studentFunnel.map((s) => s.count));

    const activeStudentCount = studentFunnel.find(s => s.status === 'Active')?.count ?? 0;
    const avgRating = mentorAnalytics.length > 0
        ? (mentorAnalytics.reduce((sum, m) => sum + m.rating, 0) / mentorAnalytics.length).toFixed(1)
        : '0';

    return (
        <DashboardLayout
            title="Analytics"
            subtitle="Performance metrics and insights"
            currentPage="analytics"
            onNavigate={handleNavigate}
        >
            <div className="space-y-6">
                {/* Tabs Navigation */}
                <div className="border-b border-border/50 overflow-x-auto">
                    <nav className="flex space-x-1" aria-label="Tabs">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                    group inline-flex items-center py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                    ${isActive
                                            ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50 dark:bg-emerald-500/10 dark:text-emerald-400'
                                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                                        }
                  `}
                                >
                                    <tab.icon
                                        className={`
                      -ml-0.5 mr-2 h-4 w-4
                      ${isActive
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-muted-foreground group-hover:text-foreground'
                                            }
                    `}
                                    />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                )}

                {/* Overview Tab */}
                {activeTab === 'overview' && !isLoading && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Key Metrics */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <StatCard
                                title="Total Cohorts"
                                value={String(totalCohorts)}
                                icon={BarChart3}
                                description="All time"
                            />
                            <StatCard
                                title="Active Students"
                                value={String(activeStudentCount)}
                                icon={Users}
                                description={`${totalStudents} total`}
                            />
                            <StatCard
                                title="Total Mentors"
                                value={String(totalMentors)}
                                icon={Target}
                                description="On platform"
                            />
                            <StatCard
                                title="Avg Mentor Rating"
                                value={`${avgRating}/5`}
                                icon={Star}
                                description={`${mentorAnalytics.length} mentors`}
                            />
                        </div>

                        {/* Funnel & Revenue Trend */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Student Funnel */}
                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Student Funnel
                                        </CardTitle>
                                    </div>
                                    <CardDescription>
                                        Distribution across lifecycle states
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    {studentFunnel.map((item) => (
                                        <div key={item.status} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground font-medium">
                                                    {item.status}
                                                </span>
                                                <span className="font-bold">{item.count}</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                                                    style={{
                                                        width: `${(item.count / maxFunnelCount) * 100
                                                            }%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Revenue Trend */}
                            <Card className="bg-white dark:bg-card border-border/50">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                        <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Revenue Trend
                                        </CardTitle>
                                    </div>
                                    <CardDescription>Monthly revenue overview</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <div className="h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center mb-3">
                                            <Info className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground">Coming Soon</p>
                                        <p className="text-xs text-muted-foreground mt-1">Revenue tracking will be available once payment integration is connected.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid gap-6 md:grid-cols-3">
                            <Card className="p-5 bg-white dark:bg-card border-border/50">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                                        <Calendar className="h-6 w-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold text-foreground">{studentFunnel.find(s => s.status === 'Invited')?.count ?? 0}</p>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Pending Invitations
                                        </p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-5 bg-white dark:bg-card border-border/50">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                                        <Clock className="h-6 w-6 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold text-foreground">{studentFunnel.find(s => s.status === 'Flagged')?.count ?? 0}</p>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Flagged Students
                                        </p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-5 bg-white dark:bg-card border-border/50">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Award className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold text-foreground">{studentFunnel.find(s => s.status === 'Completed')?.count ?? 0}</p>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Completed Students
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Cohorts Tab */}
                {activeTab === 'cohorts' && !isLoading && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Card className="bg-white dark:bg-card border-border/50 overflow-hidden">
                            <CardHeader className="px-5 pt-5 pb-2">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Cohort Performance
                                        </CardTitle>
                                        <CardDescription>
                                            Track progress and completion rates across cohorts
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="relative w-full overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/20">
                                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Cohort Name
                                                </th>
                                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Students
                                                </th>
                                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Avg Progress
                                                </th>
                                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Completion
                                                </th>
                                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Dropout
                                                </th>
                                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Rating
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cohortAnalytics.map((cohort, index) => (
                                                <tr
                                                    key={cohort.cohortId}
                                                    className={`border-b border-border/40 hover:bg-muted/30 transition-colors ${index === cohortAnalytics.length - 1
                                                            ? 'border-b-0'
                                                            : ''
                                                        }`}
                                                >
                                                    <td className="px-5 py-4 align-middle text-[13px] font-medium text-foreground">
                                                        {cohort.cohortName}
                                                    </td>
                                                    <td className="px-5 py-4 align-middle text-[13px] text-muted-foreground">
                                                        {cohort.totalStudents}
                                                    </td>
                                                    <td className="px-5 py-4 align-middle">
                                                        <div className="flex items-center gap-2 w-32">
                                                            <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-emerald-500 rounded-full"
                                                                    style={{
                                                                        width: `${cohort.averageProgress}%`
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className="text-[11px] font-medium text-muted-foreground w-8">
                                                                {cohort.averageProgress}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 align-middle">
                                                        {cohort.completionRate > 0 ? (
                                                            <Badge
                                                                variant="success"
                                                                className="text-[10px] px-2 py-0.5 font-medium"
                                                            >
                                                                {cohort.completionRate}%
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-[11px] text-muted-foreground">
                                                                In Progress
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 align-middle">
                                                        <span
                                                            className={`text-[11px] font-medium ${cohort.dropoutRate > 5
                                                                    ? 'text-red-600'
                                                                    : 'text-muted-foreground'
                                                                }`}
                                                        >
                                                            {cohort.dropoutRate}%
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 align-middle">
                                                        <div className="flex items-center gap-1">
                                                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                                            <span className="text-[12px] font-medium">
                                                                {cohort.averageRating}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Mentors Tab */}
                {activeTab === 'mentors' && !isLoading && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Card className="bg-white dark:bg-card border-border/50 overflow-hidden">
                            <CardHeader className="px-5 pt-5 pb-2">
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Mentor Performance
                                        </CardTitle>
                                        <CardDescription>
                                            Session completion and student satisfaction metrics
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="relative w-full overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/20">
                                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Mentor
                                                </th>
                                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Active Students
                                                </th>
                                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Sessions
                                                </th>
                                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Completion
                                                </th>
                                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Rating
                                                </th>
                                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Satisfaction
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mentorAnalytics.map((mentor, index) => {
                                                const completionRate = mentor.totalSessions > 0 ? Math.round(
                                                    (mentor.completedSessions / mentor.totalSessions) *
                                                    100
                                                ) : 0;
                                                return (
                                                    <tr
                                                        key={mentor.mentorId}
                                                        className={`border-b border-border/40 hover:bg-muted/30 transition-colors ${index === mentorAnalytics.length - 1
                                                                ? 'border-b-0'
                                                                : ''
                                                            }`}
                                                    >
                                                        <td className="px-5 py-4 align-middle">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-8 w-8 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                                                    {mentor.mentorName.charAt(0)}
                                                                </div>
                                                                <span className="text-[13px] font-medium text-foreground">
                                                                    {mentor.mentorName}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4 align-middle text-[13px] text-muted-foreground">
                                                            {mentor.activeStudents}
                                                        </td>
                                                        <td className="px-5 py-4 align-middle text-[13px] text-muted-foreground">
                                                            {mentor.completedSessions} /{' '}
                                                            {mentor.totalSessions}
                                                        </td>
                                                        <td className="px-5 py-4 align-middle">
                                                            <Badge
                                                                variant={
                                                                    completionRate >= 90 ? 'success' : 'neutral'
                                                                }
                                                                className="text-[10px] px-2 py-0.5 font-medium"
                                                            >
                                                                {completionRate}%
                                                            </Badge>
                                                        </td>
                                                        <td className="px-5 py-4 align-middle">
                                                            <div className="flex items-center gap-1">
                                                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                                                <span className="text-[12px] font-medium">
                                                                    {mentor.rating}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4 align-middle">
                                                            <div className="flex items-center gap-2 w-28">
                                                                <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full ${mentor.studentsSatisfaction >= 90
                                                                                ? 'bg-emerald-500'
                                                                                : mentor.studentsSatisfaction >= 80
                                                                                    ? 'bg-primary'
                                                                                    : 'bg-amber-500'
                                                                            }`}
                                                                        style={{
                                                                            width: `${mentor.studentsSatisfaction}%`
                                                                        }}
                                                                    />
                                                                </div>
                                                                <span className="text-[11px] font-medium text-muted-foreground w-8">
                                                                    {mentor.studentsSatisfaction}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Revenue Tab */}
                {activeTab === 'revenue' && !isLoading && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Card className="bg-white dark:bg-card border-border/50">
                            <CardContent className="py-16">
                                <div className="flex flex-col items-center justify-center text-center">
                                    <div className="h-16 w-16 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
                                        <IndianRupee className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Revenue Analytics Coming Soon</h3>
                                    <p className="text-sm text-muted-foreground max-w-md">
                                        Revenue tracking, payment collection analytics, and financial reports will be available
                                        once the payment integration is connected. Stay tuned!
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
