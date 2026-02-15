import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PageName } from '../components/layout/Sidebar';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent } from
'../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/dashboard/StatCard';
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
  Award } from
'lucide-react';
import { CohortAnalytics, MentorAnalytics, RevenueData } from '../types';
interface AnalyticsPageProps {
  currentPage: PageName;
  onNavigate: (page: PageName) => void;
  onBillingClick?: () => void;
  onSelectEntity?: (type: 'student' | 'mentor' | 'cohort', id: string) => void;
}
type AnalyticsTab = 'overview' | 'cohorts' | 'mentors' | 'revenue';
// Mock Data
const mockCohortAnalytics: CohortAnalytics[] = [
{
  cohortId: 'C-2024-001',
  cohortName: 'Spring 2024 Design Systems',
  completionRate: 87,
  averageProgress: 75,
  dropoutRate: 4,
  averageRating: 4.8,
  totalStudents: 24
},
{
  cohortId: 'C-2024-002',
  cohortName: 'Winter 2024 Product Strategy',
  completionRate: 82,
  averageProgress: 60,
  dropoutRate: 6,
  averageRating: 4.6,
  totalStudents: 18
},
{
  cohortId: 'C-2024-003',
  cohortName: 'Spring 2024 Foundations',
  completionRate: 0,
  averageProgress: 45,
  dropoutRate: 3,
  averageRating: 4.9,
  totalStudents: 32
},
{
  cohortId: 'C-2024-004',
  cohortName: 'Summer 2024 Interaction',
  completionRate: 0,
  averageProgress: 20,
  dropoutRate: 0,
  averageRating: 4.7,
  totalStudents: 28
}];

const mockMentorAnalytics: MentorAnalytics[] = [
{
  mentorId: 'M-001',
  mentorName: 'Sarah Chen',
  rating: 4.9,
  totalSessions: 48,
  completedSessions: 45,
  studentsSatisfaction: 96,
  activeStudents: 12
},
{
  mentorId: 'M-002',
  mentorName: 'Mike Ross',
  rating: 4.7,
  totalSessions: 36,
  completedSessions: 32,
  studentsSatisfaction: 88,
  activeStudents: 10
},
{
  mentorId: 'M-003',
  mentorName: 'Alex Kim',
  rating: 4.8,
  totalSessions: 24,
  completedSessions: 24,
  studentsSatisfaction: 92,
  activeStudents: 8
},
{
  mentorId: 'M-004',
  mentorName: 'Jessica Lee',
  rating: 5.0,
  totalSessions: 30,
  completedSessions: 28,
  studentsSatisfaction: 98,
  activeStudents: 9
},
{
  mentorId: 'M-005',
  mentorName: 'David Park',
  rating: 4.6,
  totalSessions: 20,
  completedSessions: 18,
  studentsSatisfaction: 85,
  activeStudents: 7
}];

const mockRevenueData: RevenueData[] = [
{
  month: 'Jan',
  revenue: 320000,
  collections: 300000,
  pending: 20000
},
{
  month: 'Feb',
  revenue: 410000,
  collections: 380000,
  pending: 30000
},
{
  month: 'Mar',
  revenue: 480000,
  collections: 450000,
  pending: 30000
},
{
  month: 'Apr',
  revenue: 520000,
  collections: 490000,
  pending: 30000
},
{
  month: 'May',
  revenue: 490000,
  collections: 460000,
  pending: 30000
},
{
  month: 'Jun',
  revenue: 230000,
  collections: 130000,
  pending: 100000
}];

const studentFunnel = [
{
  status: 'Invited',
  count: 45,
  color: 'bg-muted-foreground'
},
{
  status: 'Active',
  count: 186,
  color: 'bg-emerald-500'
},
{
  status: 'Flagged',
  count: 8,
  color: 'bg-amber-500'
},
{
  status: 'Completed',
  count: 52,
  color: 'bg-blue-500'
},
{
  status: 'Dropped',
  count: 12,
  color: 'bg-red-500'
}];

export function AnalyticsPage({
  currentPage,
  onNavigate,
  onBillingClick,
  onSelectEntity
}: AnalyticsPageProps) {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
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
  }];

  const maxFunnelCount = Math.max(...studentFunnel.map((s) => s.count));
  const maxRevenue = Math.max(...mockRevenueData.map((r) => r.revenue));
  const totalRevenue = mockRevenueData.reduce((sum, r) => sum + r.revenue, 0);
  const totalCollections = mockRevenueData.reduce(
    (sum, r) => sum + r.collections,
    0
  );
  const totalPending = mockRevenueData.reduce((sum, r) => sum + r.pending, 0);
  return (
    <DashboardLayout
      title="Analytics"
      subtitle="Performance metrics and insights"
      currentPage={currentPage}
      onNavigate={onNavigate}
      onBillingClick={onBillingClick}
      onSelectEntity={onSelectEntity}>

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
                    ${isActive ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50 dark:bg-emerald-500/10 dark:text-emerald-400' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}
                  `}>

                  <tab.icon
                    className={`
                      -ml-0.5 mr-2 h-4 w-4
                      ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground group-hover:text-foreground'}
                    `} />

                  {tab.label}
                </button>);

            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' &&
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Key Metrics */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
              title="Total Revenue"
              value="₹24.5L"
              icon={IndianRupee}
              trend="+18%"
              trendUp={true}
              description="vs last month" />

              <StatCard
              title="Active Students"
              value="186"
              icon={Users}
              trend="+12%"
              trendUp={true}
              description="vs last month" />

              <StatCard
              title="Completion Rate"
              value="87%"
              icon={Target}
              trend="+5%"
              trendUp={true}
              description="vs last month" />

              <StatCard
              title="Avg Rating"
              value="4.8/5"
              icon={Star}
              trend="+0.2"
              trendUp={true}
              description="vs last month" />

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
                  {studentFunnel.map((item) =>
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
                        width: `${item.count / maxFunnelCount * 100}%`
                      }} />

                      </div>
                    </div>
                )}
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
                  <CardDescription>Monthly revenue for 2024</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {mockRevenueData.map((item) =>
                <div key={item.month} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground w-8 font-medium">
                          {item.month}
                        </span>
                        <div className="flex-1 mx-3">
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${item.revenue / maxRevenue * 100}%`
                          }} />

                          </div>
                        </div>
                        <span className="font-bold text-xs w-16 text-right">
                          ₹{(item.revenue / 100000).toFixed(1)}L
                        </span>
                      </div>
                    </div>
                )}
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
                    <p className="text-3xl font-bold text-foreground">24</p>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Upcoming Sessions
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
                    <p className="text-3xl font-bold text-foreground">12</p>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Pending Submissions
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
                    <p className="text-3xl font-bold text-foreground">8</p>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Certificates to Issue
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        }

        {/* Cohorts Tab */}
        {activeTab === 'cohorts' &&
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
                      {mockCohortAnalytics.map((cohort, index) =>
                    <tr
                      key={cohort.cohortId}
                      className={`border-b border-border/40 hover:bg-muted/30 transition-colors ${index === mockCohortAnalytics.length - 1 ? 'border-b-0' : ''}`}>

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
                              }} />

                              </div>
                              <span className="text-[11px] font-medium text-muted-foreground w-8">
                                {cohort.averageProgress}%
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 align-middle">
                            {cohort.completionRate > 0 ?
                        <Badge
                          variant="success"
                          className="text-[10px] px-2 py-0.5 font-medium">

                                {cohort.completionRate}%
                              </Badge> :

                        <span className="text-[11px] text-muted-foreground">
                                In Progress
                              </span>
                        }
                          </td>
                          <td className="px-5 py-4 align-middle">
                            <span
                          className={`text-[11px] font-medium ${cohort.dropoutRate > 5 ? 'text-red-600' : 'text-muted-foreground'}`}>

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
                    )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        }

        {/* Mentors Tab */}
        {activeTab === 'mentors' &&
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
                      {mockMentorAnalytics.map((mentor, index) => {
                      const completionRate = Math.round(
                        mentor.completedSessions / mentor.totalSessions *
                        100
                      );
                      return (
                        <tr
                          key={mentor.mentorId}
                          className={`border-b border-border/40 hover:bg-muted/30 transition-colors ${index === mockMentorAnalytics.length - 1 ? 'border-b-0' : ''}`}>

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
                              className="text-[10px] px-2 py-0.5 font-medium">

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
                                  className={`h-full rounded-full ${mentor.studentsSatisfaction >= 90 ? 'bg-emerald-500' : mentor.studentsSatisfaction >= 80 ? 'bg-primary' : 'bg-amber-500'}`}
                                  style={{
                                    width: `${mentor.studentsSatisfaction}%`
                                  }} />

                                </div>
                                <span className="text-[11px] font-medium text-muted-foreground w-8">
                                  {mentor.studentsSatisfaction}%
                                </span>
                              </div>
                            </td>
                          </tr>);

                    })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        }

        {/* Revenue Tab */}
        {activeTab === 'revenue' &&
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Revenue Summary Cards */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="p-5 bg-white dark:bg-card border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Total Revenue
                  </span>
                  <div className="h-8 w-8 rounded-md bg-emerald-100 flex items-center justify-center">
                    <IndianRupee className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold">
                  ₹{(totalRevenue / 100000).toFixed(1)}L
                </p>
                <p className="text-xs text-muted-foreground mt-1">YTD 2024</p>
              </Card>

              <Card className="p-5 bg-white dark:bg-card border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Collected
                  </span>
                  <div className="h-8 w-8 rounded-md bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-emerald-600">
                  ₹{(totalCollections / 100000).toFixed(1)}L
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(totalCollections / totalRevenue * 100)}% of
                  total
                </p>
              </Card>

              <Card className="p-5 bg-white dark:bg-card border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Pending
                  </span>
                  <div className="h-8 w-8 rounded-md bg-amber-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-amber-600">
                  ₹{(totalPending / 100000).toFixed(1)}L
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting payment
                </p>
              </Card>

              <Card className="p-5 bg-white dark:bg-card border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Overdue
                  </span>
                  <div className="h-8 w-8 rounded-md bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-red-600">₹0.6L</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Requires follow-up
                </p>
              </Card>
            </div>

            {/* Monthly Revenue Breakdown */}
            <Card className="bg-white dark:bg-card border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Monthly Revenue
                    </CardTitle>
                    <CardDescription>
                      Revenue breakdown by month for 2024
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockRevenueData.map((item) =>
              <div key={item.month} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium w-12">{item.month}</span>
                      <div className="flex-1 mx-4">
                        <div className="h-6 w-full bg-slate-100 dark:bg-slate-800 rounded overflow-hidden flex">
                          <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{
                          width: `${item.collections / maxRevenue * 100}%`
                        }}
                        title={`Collected: ₹${(item.collections / 100000).toFixed(1)}L`} />

                          <div
                        className="h-full bg-amber-400 transition-all duration-500"
                        style={{
                          width: `${item.pending / maxRevenue * 100}%`
                        }}
                        title={`Pending: ₹${(item.pending / 100000).toFixed(1)}L`} />

                        </div>
                      </div>
                      <span className="font-semibold w-16 text-right">
                        ₹{(item.revenue / 100000).toFixed(1)}L
                      </span>
                    </div>
                  </div>
              )}
                <div className="flex items-center gap-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded bg-emerald-500" />
                    <span>Collected</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded bg-amber-400" />
                    <span>Pending</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        }
      </div>
    </DashboardLayout>);

}