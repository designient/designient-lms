'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MoreHorizontal, ArrowRight } from 'lucide-react';

export interface ActivityItem {
    id: string;
    action: string;
    user: string;
    type: 'Student' | 'Mentor' | 'System';
    date: string;
    status: 'Completed' | 'Pending' | 'Failed';
}

interface RecentActivityTableProps {
    activities: ActivityItem[];
}

export function RecentActivityTable({ activities }: RecentActivityTableProps) {
    const getStatusVariant = (status: ActivityItem['status']) => {
        switch (status) {
            case 'Completed':
                return 'success' as const;
            case 'Pending':
                return 'warning' as const;
            case 'Failed':
                return 'destructive' as const;
            default:
                return 'neutral' as const;
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle>Recent Activity</CardTitle>
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
                                <th className="h-9 px-4 text-left align-middle text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                    Activity
                                </th>
                                <th className="h-9 px-4 text-left align-middle text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                    User
                                </th>
                                <th className="h-9 px-4 text-left align-middle text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                    Type
                                </th>
                                <th className="h-9 px-4 text-left align-middle text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                    Date
                                </th>
                                <th className="h-9 px-4 text-left align-middle text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                    Status
                                </th>
                                <th className="h-9 px-4 text-right align-middle w-8"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {activities.map((activity, index) => (
                                <tr
                                    key={activity.id}
                                    className={`border-b border-border/40 transition-colors hover:bg-muted/30 cursor-pointer group ${index === activities.length - 1 ? 'border-b-0' : ''
                                        }`}
                                >
                                    <td className="px-4 py-3 align-middle text-[13px] font-medium text-foreground">
                                        {activity.action}
                                    </td>
                                    <td className="px-4 py-3 align-middle text-[13px] text-muted-foreground">
                                        {activity.user}
                                    </td>
                                    <td className="px-4 py-3 align-middle">
                                        <Badge variant="outline" className="text-[10px]">
                                            {activity.type}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 align-middle text-muted-foreground text-[11px]">
                                        {activity.date}
                                    </td>
                                    <td className="px-4 py-3 align-middle">
                                        <Badge
                                            variant={getStatusVariant(activity.status)}
                                            className="text-[10px] px-1.5 py-0 h-5"
                                        >
                                            {activity.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 align-middle text-right">
                                        <button className="p-1 hover:bg-muted rounded transition-colors opacity-0 group-hover:opacity-100">
                                            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
