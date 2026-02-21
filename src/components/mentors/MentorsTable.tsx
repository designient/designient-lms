import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { MoreHorizontal, Star } from 'lucide-react';

export interface AssignedCohort {
    id: string;
    name: string;
    status: 'Active' | 'Completed' | 'Upcoming';
}

export interface Mentor {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    status: 'Active' | 'Inactive';
    assignedCohorts: AssignedCohort[];
    lastActive: string;
    joinDate: string;
    specialty: string;
    bio?: string;
    maxCohorts: number;
    rating: number;
    totalReviews: number;
    totalStudentsMentored: number;
    availabilityStatus: 'Available' | 'Limited' | 'Unavailable';
    phone?: string;
    whatsappOptIn?: boolean;
}

interface MentorsTableProps {
    mentors: Mentor[];
    onMentorClick: (mentor: Mentor) => void;
}

export function MentorsTable({ mentors, onMentorClick }: MentorsTableProps) {
    const getAvailabilityVariant = (status: Mentor['availabilityStatus']) => {
        switch (status) {
            case 'Available':
                return 'success';
            case 'Limited':
                return 'warning';
            case 'Unavailable':
                return 'destructive';
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
                                    Mentor
                                </th>
                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Specialty
                                </th>
                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Availability
                                </th>
                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Active Cohorts
                                </th>
                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Rating
                                </th>
                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Students
                                </th>
                                <th className="h-10 px-5 text-right align-middle w-8"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {mentors.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-5 py-8 text-center text-[13px] text-muted-foreground"
                                    >
                                        No mentors found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                mentors.map((mentor, index) => (
                                    <tr
                                        key={mentor.id}
                                        className={`border-b border-border/40 transition-colors hover:bg-muted/30 cursor-pointer group ${index === mentors.length - 1 ? 'border-b-0' : ''
                                            }`}
                                        onClick={() => onMentorClick(mentor)}
                                    >
                                        <td className="px-5 py-4 align-middle">
                                            <div className="flex items-center gap-3">
                                                {mentor.avatarUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={mentor.avatarUrl}
                                                        alt={mentor.name}
                                                        className="h-8 w-8 rounded-md object-cover border border-border/40"
                                                    />
                                                ) : (
                                                    <div className="h-8 w-8 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                        {mentor.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-medium text-foreground">
                                                        {mentor.name}
                                                    </span>
                                                    <span className="text-[11px] text-muted-foreground leading-none mt-0.5">
                                                        {mentor.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 align-middle">
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] font-medium"
                                            >
                                                {mentor.specialty}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-4 align-middle">
                                            <Badge
                                                variant={getAvailabilityVariant(
                                                    mentor.availabilityStatus
                                                )}
                                                className="text-[10px] px-2 py-0.5 font-medium"
                                            >
                                                {mentor.availabilityStatus}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-4 align-middle">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[12px] font-medium">
                                                    {
                                                        mentor.assignedCohorts.filter(
                                                            (c) => c.status === 'Active'
                                                        ).length
                                                    }{' '}
                                                    Active
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {mentor.assignedCohorts.length} Total
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 align-middle">
                                            <div className="flex items-center gap-1">
                                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                                <span className="text-[12px] font-medium">
                                                    {mentor.rating}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    ({mentor.totalReviews})
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 align-middle text-[12px] font-medium text-muted-foreground">
                                            {mentor.totalStudentsMentored}
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
