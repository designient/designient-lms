'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RateStatCard } from '@/components/dashboard/RateStatCard';
import { EngagementChart } from '@/components/dashboard/EngagementChart';
import { RecentActivityTable, type ActivityItem } from '@/components/dashboard/RecentActivityTable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ArrowRight, Filter, Download, Trophy } from 'lucide-react';
import type { PageName } from '@/types';

// Mock engagement data
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

// Mock leaderboard data
const leaderboardData = [
    { name: 'Sarah Chen', score: '4.9', students: 24, badge: 'Top Rated' },
    { name: 'Mike Ross', score: '4.8', students: 18, badge: 'Rising Star' },
    { name: 'Priya Sharma', score: '4.7', students: 22, badge: 'Consistent' },
    { name: 'David Kim', score: '4.6', students: 15, badge: null },
    { name: 'Anna Lee', score: '4.5', students: 20, badge: null },
];

// Mock recent activities
const recentActivities: ActivityItem[] = [
    { id: '1', action: 'Student enrolled in cohort', user: 'Sofia Rodriguez', type: 'Student', date: '2 hours ago', status: 'Completed' },
    { id: '2', action: 'Session feedback submitted', user: 'Sarah Chen', type: 'Mentor', date: '4 hours ago', status: 'Completed' },
    { id: '3', action: 'Payment received', user: 'James Wilson', type: 'System', date: '6 hours ago', status: 'Completed' },
    { id: '4', action: 'Assignment submission', user: 'Emma Thompson', type: 'Student', date: '8 hours ago', status: 'Pending' },
    { id: '5', action: 'Mentor onboarding started', user: 'Alex Rivera', type: 'Mentor', date: '1 day ago', status: 'Pending' },
];

export default function DashboardPage() {
    const router = useRouter();
    const [period, setPeriod] = useState('30d');

    const handleNavigate = (page: PageName) => {
        router.push(`/${page}`);
    };

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
                            <Badge variant="default" className="ml-1 text-[9px] px-1">2</Badge>
                        </Button>
                        <Button variant="outline" size="sm">
                            <Download className="h-3.5 w-3.5" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <RateStatCard
                        title="Completion Rate"
                        rate="87.3%"
                        trend="+2.1%"
                        trendUp={true}
                        metric1Label="Completed"
                        metric1Value="156"
                        metric2Label="In Progress"
                        metric2Value="23"
                    />
                    <RateStatCard
                        title="Student Engagement"
                        rate="92.1%"
                        trend="+5.4%"
                        trendUp={true}
                        metric1Label="Active"
                        metric1Value="184"
                        metric2Label="At Risk"
                        metric2Value="8"
                    />
                    <RateStatCard
                        title="Mentor Utilization"
                        rate="78.5%"
                        trend="-1.2%"
                        trendUp={false}
                        metric1Label="Active Mentors"
                        metric1Value="12"
                        metric2Label="Avg Load"
                        metric2Value="15.3"
                    />
                    <RateStatCard
                        title="Revenue"
                        rate="₹24.5L"
                        trend="+12.8%"
                        trendUp={true}
                        metric1Label="Collections"
                        metric1Value="₹22.1L"
                        metric2Label="Pending"
                        metric2Value="₹2.4L"
                    />
                </div>

                {/* Chart & Leaderboard */}
                <div className="grid gap-6 lg:grid-cols-3 h-[400px]">
                    <div className="lg:col-span-2">
                        <EngagementChart data={engagementData} title="Student Engagement Trends" />
                    </div>
                    <Card className="flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-yellow-500" />
                                Top Mentors
                            </CardTitle>
                            <button className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                                View All
                                <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-3">
                            {leaderboardData.map((mentor, index) => (
                                <div
                                    key={mentor.name}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-xs font-bold text-muted-foreground">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {mentor.name}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {mentor.students} students
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-foreground">
                                            {mentor.score}
                                        </p>
                                        {mentor.badge && (
                                            <Badge variant="default" className="text-[9px]">
                                                {mentor.badge}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <RecentActivityTable activities={recentActivities} />
            </div>
        </DashboardLayout>
    );
}
