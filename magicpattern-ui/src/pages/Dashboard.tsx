import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { RateStatCard } from '../components/dashboard/RateStatCard';
import { EngagementChart } from '../components/dashboard/EngagementChart';
import { LeaderboardPanel } from '../components/dashboard/LeaderboardPanel';
import {
  RecentActivityTable,
  ActivityItem } from
'../components/dashboard/RecentActivityTable';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { PageName } from '../components/layout/Sidebar';
interface DashboardProps {
  currentPage: PageName;
  onNavigate: (page: PageName) => void;
  onBillingClick?: () => void;
  onSelectEntity?: (type: 'student' | 'mentor' | 'cohort', id: string) => void;
}
export function Dashboard({
  currentPage,
  onNavigate,
  onBillingClick,
  onSelectEntity
}: DashboardProps) {
  const [period, setPeriod] = useState('7d');
  // Mock Data
  const engagementData = [
  {
    date: 'Mon',
    value: 45
  },
  {
    date: 'Tue',
    value: 52
  },
  {
    date: 'Wed',
    value: 38
  },
  {
    date: 'Thu',
    value: 65
  },
  {
    date: 'Fri',
    value: 48
  },
  {
    date: 'Sat',
    value: 35
  },
  {
    date: 'Sun',
    value: 42
  }];

  const leaderboardData = [
  {
    rank: 1,
    name: 'Sarah Chen',
    score: 9850,
    trend: 'up' as const
  },
  {
    rank: 2,
    name: 'Mike Ross',
    score: 8720,
    trend: 'up' as const
  },
  {
    rank: 3,
    name: 'Jessica Lee',
    score: 8450,
    trend: 'neutral' as const
  },
  {
    rank: 4,
    name: 'David Park',
    score: 7900,
    trend: 'down' as const
  },
  {
    rank: 5,
    name: 'Alex Kim',
    score: 7240,
    trend: 'up' as const
  }];

  const recentActivities: ActivityItem[] = [
  {
    id: '1',
    action: 'Completed Assignment: UI Basics',
    user: 'Emma Thompson',
    type: 'Student',
    date: '2 mins ago',
    status: 'Completed'
  },
  {
    id: '2',
    action: 'Scheduled Session',
    user: 'Sarah Chen',
    type: 'Mentor',
    date: '15 mins ago',
    status: 'Pending'
  },
  {
    id: '3',
    action: 'New Enrollment',
    user: 'James Wilson',
    type: 'System',
    date: '1 hour ago',
    status: 'Completed'
  },
  {
    id: '4',
    action: 'Payment Failed',
    user: 'Tom Holland',
    type: 'Student',
    date: '3 hours ago',
    status: 'Failed'
  },
  {
    id: '5',
    action: 'Cohort Created',
    user: 'Super Admin',
    type: 'System',
    date: '5 hours ago',
    status: 'Completed'
  }];

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Overview"
      currentPage={currentPage}
      onNavigate={onNavigate}
      onBillingClick={onBillingClick}
      onSelectEntity={onSelectEntity}>

      <div className="space-y-6 pb-8">
        {/* Header Controls */}
        <DashboardHeader
          selectedPeriod={period}
          onPeriodChange={setPeriod}
          filterCount={2}
          onFiltersClick={() => {}} />


        {/* Stat Cards Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <RateStatCard
            title="Completion Rate"
            rate="87.3%"
            trend="12%"
            trendUp={true}
            metric1Label="Active Students"
            metric1Value="186"
            metric2Label="Graduates"
            metric2Value="45"
            onClick={() => onNavigate('analytics')} />

          <RateStatCard
            title="Engagement Rate"
            rate="64.2%"
            trend="5.4%"
            trendUp={false}
            metric1Label="Daily Active"
            metric1Value="92"
            metric2Label="Avg Session"
            metric2Value="45m"
            onClick={() => onNavigate('analytics')} />

          <RateStatCard
            title="Mentor Utilization"
            rate="92.0%"
            trend="8.1%"
            trendUp={true}
            metric1Label="Total Sessions"
            metric1Value="142"
            metric2Label="Available"
            metric2Value="8"
            onClick={() => onNavigate('mentors')} />

          <RateStatCard
            title="Revenue Growth"
            rate="₹24.5L"
            trend="18.2%"
            trendUp={true}
            metric1Label="This Month"
            metric1Value="₹4.2L"
            metric2Label="Pending"
            metric2Value="₹0.8L"
            onClick={() => onNavigate('analytics')} />

        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3 h-[400px]">
          {/* Chart Section (2/3 width) */}
          <div className="lg:col-span-2 h-full">
            <EngagementChart
              data={engagementData}
              title="Student Engagement Trends" />

          </div>

          {/* Leaderboard Section (1/3 width) */}
          <div className="h-full">
            <LeaderboardPanel title="Top Mentors" items={leaderboardData} />
          </div>
        </div>

        {/* Bottom Table Section */}
        <div>
          <RecentActivityTable activities={recentActivities} />
        </div>
      </div>
    </DashboardLayout>);

}