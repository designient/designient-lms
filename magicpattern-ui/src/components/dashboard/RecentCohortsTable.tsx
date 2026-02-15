import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { MoreHorizontal, ArrowRight } from 'lucide-react';
interface Cohort {
  id: string;
  name: string;
  program: string;
  status: 'Active' | 'Upcoming' | 'Completed';
  students: number;
  startDate: string;
}
const recentCohorts: Cohort[] = [
{
  id: '1',
  name: 'Spring 2024 Design Systems',
  program: 'Advanced UI',
  status: 'Active',
  students: 24,
  startDate: 'Mar 1, 2024'
},
{
  id: '2',
  name: 'Winter 2024 Product Strategy',
  program: 'Product Design',
  status: 'Active',
  students: 18,
  startDate: 'Feb 15, 2024'
},
{
  id: '3',
  name: 'Spring 2024 Foundations',
  program: 'UX Fundamentals',
  status: 'Upcoming',
  students: 32,
  startDate: 'Apr 1, 2024'
},
{
  id: '4',
  name: 'Winter 2023 Advanced UI',
  program: 'Advanced UI',
  status: 'Completed',
  students: 22,
  startDate: 'Nov 10, 2023'
},
{
  id: '5',
  name: 'Fall 2023 Research',
  program: 'UX Research',
  status: 'Completed',
  students: 15,
  startDate: 'Sep 5, 2023'
}];

export function RecentCohortsTable() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle>Recent Cohorts</CardTitle>
        <button className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
          View All
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </CardHeader>
      <CardContent className="pt-0 px-0">
        <div className="relative w-full overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="h-8 px-3 text-left align-middle text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Cohort Name
                </th>
                <th className="h-8 px-3 text-left align-middle text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Program
                </th>
                <th className="h-8 px-3 text-left align-middle text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Start Date
                </th>
                <th className="h-8 px-3 text-left align-middle text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Students
                </th>
                <th className="h-8 px-3 text-left align-middle text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Status
                </th>
                <th className="h-8 px-3 text-right align-middle w-8"></th>
              </tr>
            </thead>
            <tbody>
              {recentCohorts.map((cohort, index) =>
              <tr
                key={cohort.id}
                className={`border-b border-border/40 transition-colors hover:bg-muted/30 cursor-pointer group ${index === recentCohorts.length - 1 ? 'border-b-0' : ''}`}>

                  <td className="px-3 py-2 align-middle text-[13px] font-medium text-foreground">
                    {cohort.name}
                  </td>
                  <td className="px-3 py-2 align-middle text-[13px] text-muted-foreground">
                    {cohort.program}
                  </td>
                  <td className="px-3 py-2 align-middle text-muted-foreground text-[11px]">
                    {cohort.startDate}
                  </td>
                  <td className="px-3 py-2 align-middle text-muted-foreground text-[11px]">
                    {cohort.students}
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <Badge
                    variant={
                    cohort.status === 'Active' ?
                    'success' :
                    cohort.status === 'Upcoming' ?
                    'neutral' :
                    'secondary'
                    }
                    className="text-[10px] px-1.5 py-0 h-5">

                      {cohort.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 align-middle text-right">
                    <button className="p-1 hover:bg-muted rounded transition-colors opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>);

}