import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { MoreHorizontal, Calendar, Users } from 'lucide-react';
import { Cohort } from '../../types';

interface CohortsTableProps {
    cohorts: Cohort[];
    onCohortClick: (cohort: Cohort) => void;
}

export function CohortsTable({ cohorts, onCohortClick }: CohortsTableProps) {
    const getStatusVariant = (status: Cohort['status']): 'success' | 'neutral' | 'warning' | 'secondary' | 'default' => {
        switch (status) {
            case 'Active':
                return 'success';
            case 'Upcoming':
                return 'warning';
            case 'Completed':
                return 'neutral';
            case 'Archived':
                return 'secondary';
            default:
                return 'neutral';
        }
    };

    return (
        <Card className="overflow-hidden bg-white dark:bg-card border-border/50 shadow-sm">
            <CardContent className="p-0">
                <div className="relative w-full overflow-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/20">
                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Cohort Name
                                </th>
                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Program
                                </th>
                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Timeline
                                </th>
                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Enrollment
                                </th>
                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Mentors
                                </th>
                                <th className="h-10 px-5 text-right align-middle w-8"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {cohorts.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-5 py-8 text-center text-[13px] text-muted-foreground"
                                    >
                                        No cohorts found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                cohorts.map((cohort, index) => (
                                    <tr
                                        key={cohort.id}
                                        className={`border-b border-border/40 transition-colors hover:bg-muted/30 cursor-pointer group ${index === cohorts.length - 1 ? 'border-b-0' : ''
                                            }`}
                                        onClick={() => onCohortClick(cohort)}
                                    >
                                        <td className="px-5 py-4 align-middle">
                                            <span className="text-[13px] font-medium text-foreground">
                                                {cohort.name}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 align-middle text-[12px] text-muted-foreground">
                                            {cohort.programName}
                                        </td>
                                        <td className="px-5 py-4 align-middle">
                                            <Badge
                                                variant={getStatusVariant(cohort.status)}
                                                className="text-[10px] px-2 py-0.5 font-medium"
                                            >
                                                {cohort.status}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-4 align-middle">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span className="text-[12px]">
                                                    {cohort.startDate} - {cohort.endDate}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 align-middle">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                                    <span>
                                                        {cohort.studentCount} / {cohort.capacity}
                                                    </span>
                                                    <span>
                                                        {Math.round(
                                                            (cohort.studentCount / cohort.capacity) * 100
                                                        )}
                                                        %
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-24 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${cohort.studentCount >= cohort.capacity
                                                                ? 'bg-amber-500'
                                                                : 'bg-emerald-500'
                                                            }`}
                                                        style={{
                                                            width: `${Math.min(
                                                                (cohort.studentCount / cohort.capacity) * 100,
                                                                100
                                                            )}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 align-middle">
                                            <div className="flex -space-x-2 overflow-hidden">
                                                {cohort.mentors.slice(0, 3).map((mentor, i) => (
                                                    <div
                                                        key={i}
                                                        className="inline-block h-6 w-6 rounded-full ring-2 ring-background bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300"
                                                        title={mentor}
                                                    >
                                                        {mentor.charAt(0)}
                                                    </div>
                                                ))}
                                                {cohort.mentors.length > 3 && (
                                                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground">
                                                        +{cohort.mentors.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 align-middle text-right">
                                            <button
                                                className="p-1 hover:bg-muted rounded transition-colors opacity-0 group-hover:opacity-100"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
