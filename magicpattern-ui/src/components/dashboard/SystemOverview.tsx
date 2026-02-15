import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import {
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  FileText,
  Award } from
'lucide-react';
import { PageName } from '../layout/Sidebar';
interface CohortSummary {
  id: string;
  name: string;
  date: string;
  students: number;
  status: 'Upcoming' | 'Completed';
}
interface SystemOverviewProps {
  onNavigate: (page: PageName) => void;
}
export function SystemOverview({ onNavigate }: SystemOverviewProps) {
  const upcomingCohorts: CohortSummary[] = [
  {
    id: 'c1',
    name: 'Summer 2024 Advanced UI',
    date: 'Starts Apr 15',
    students: 28,
    status: 'Upcoming'
  },
  {
    id: 'c2',
    name: 'Summer 2024 UX Research',
    date: 'Starts May 01',
    students: 15,
    status: 'Upcoming'
  }];

  const completedCohorts: CohortSummary[] = [
  {
    id: 'c3',
    name: 'Winter 2024 Product Strategy',
    date: 'Ended Mar 10',
    students: 22,
    status: 'Completed'
  },
  {
    id: 'c4',
    name: 'Winter 2024 Foundations',
    date: 'Ended Feb 28',
    students: 30,
    status: 'Completed'
  }];

  return (
    <div className="space-y-3">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card
          className="p-2.5 flex items-center gap-2.5 group hover:border-primary/30 dark:hover:shadow-[0_0_15px_-5px_hsl(var(--primary)/0.3)] transition-all cursor-pointer"
          onClick={() => onNavigate('cohorts')}
          role="button"
          tabIndex={0}>

          <div className="h-8 w-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary transition-all group-hover:scale-105">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">
              Upcoming Sessions
            </p>
            <p className="text-base font-semibold leading-none">12</p>
          </div>
        </Card>
        <Card
          className="p-2.5 flex items-center gap-2.5 group hover:border-amber-500/30 dark:hover:shadow-[0_0_15px_-5px_rgb(245_158_11/0.3)] transition-all cursor-pointer"
          onClick={() => onNavigate('students')}
          role="button"
          tabIndex={0}>

          <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 transition-all group-hover:scale-105">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Pending Reviews</p>
            <p className="text-base font-semibold leading-none">8</p>
          </div>
        </Card>
        <Card
          className="p-2.5 flex items-center gap-2.5 group hover:border-emerald-500/30 dark:hover:shadow-[0_0_15px_-5px_rgb(16_185_129/0.3)] transition-all cursor-pointer"
          onClick={() => onNavigate('students')}
          role="button"
          tabIndex={0}>

          <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 transition-all group-hover:scale-105">
            <Award className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">
              Certificates Due
            </p>
            <p className="text-base font-semibold leading-none">22</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {/* Upcoming Cohorts */}
        <Card className="overflow-hidden">
          <CardHeader className="py-2 px-3 border-b border-border/40 bg-muted/20 dark:bg-muted/10">
            <h3 className="text-xs font-semibold tracking-tight text-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Upcoming Cohorts
            </h3>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {upcomingCohorts.map((cohort) =>
              <div
                key={cohort.id}
                className="px-3 py-2 flex items-center justify-between hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors cursor-pointer group"
                onClick={() => onNavigate('cohorts')}
                role="button"
                tabIndex={0}>

                  <div>
                    <h4 className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors">
                      {cohort.name}
                    </h4>
                    <p className="text-[10px] text-muted-foreground">
                      {cohort.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 dark:bg-muted/30 px-1.5 py-0.5 rounded">
                      <Users className="h-2.5 w-2.5" />
                      {cohort.students}
                    </div>
                    <Badge
                    variant="neutral"
                    className="text-[9px] px-1 py-0 h-4">

                      {cohort.status}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recently Completed */}
        <Card className="overflow-hidden">
          <CardHeader className="py-2 px-3 border-b border-border/40 bg-muted/20 dark:bg-muted/10">
            <h3 className="text-xs font-semibold tracking-tight text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Recently Completed
            </h3>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {completedCohorts.map((cohort) =>
              <div
                key={cohort.id}
                className="px-3 py-2 flex items-center justify-between hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors cursor-pointer group"
                onClick={() => onNavigate('cohorts')}
                role="button"
                tabIndex={0}>

                  <div>
                    <h4 className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors">
                      {cohort.name}
                    </h4>
                    <p className="text-[10px] text-muted-foreground">
                      {cohort.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 dark:bg-muted/30 px-1.5 py-0.5 rounded">
                      <Users className="h-2.5 w-2.5" />
                      {cohort.students}
                    </div>
                    <Badge
                    variant="success"
                    className="text-[9px] px-1 py-0 h-4">

                      {cohort.status}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);

}