'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Calendar, TrendingUp } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface AttendanceItem {
    id: string;
    status: string;
    sessionTitle: string;
    courseTitle: string;
    cohortName: string;
    scheduledAt: string;
}

interface CourseBreakdown {
    courseId: string;
    courseTitle: string;
    total: number;
    present: number;
    percentage: number;
}

interface AttendanceData {
    attendances: AttendanceItem[];
    summary: { total: number; present: number; percentage: number };
    courseBreakdown: CourseBreakdown[];
}

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
    PRESENT: { label: 'Present', color: 'text-emerald-600', dot: 'bg-emerald-500' },
    ABSENT: { label: 'Absent', color: 'text-red-600', dot: 'bg-red-500' },
    LATE: { label: 'Late', color: 'text-amber-600', dot: 'bg-amber-500' },
    EXCUSED: { label: 'Excused', color: 'text-blue-600', dot: 'bg-blue-500' },
};

export default function StudentAttendancePage() {
    const [data, setData] = useState<AttendanceData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        apiClient.get<AttendanceData>('/api/v1/me/attendance')
            .then(setData)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data) return <p className="text-center py-12 text-muted-foreground">Unable to load attendance</p>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">My Attendance</h1>
                <p className="text-muted-foreground mt-1">Your class attendance record</p>
            </div>

            {/* Overall percentage */}
            <div className="rounded-xl border border-border/50 bg-card p-6">
                <div className="flex items-center gap-4">
                    <div className={`h-16 w-16 rounded-full flex items-center justify-center text-lg font-bold ${data.summary.percentage >= 75 ? 'bg-emerald-500/10 text-emerald-600' :
                            data.summary.percentage >= 50 ? 'bg-amber-500/10 text-amber-600' :
                                'bg-red-500/10 text-red-600'
                        }`}>
                        {data.summary.percentage}%
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-foreground">Overall Attendance</p>
                        <p className="text-sm text-muted-foreground">{data.summary.present} present out of {data.summary.total} sessions</p>
                    </div>
                </div>
            </div>

            {/* Course breakdown */}
            {data.courseBreakdown.length > 0 && (
                <div className="rounded-xl border border-border/50 bg-card">
                    <div className="p-5 border-b border-border/50">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                            By Course
                        </h2>
                    </div>
                    <div className="divide-y divide-border/50">
                        {data.courseBreakdown.map(cb => (
                            <div key={cb.courseId} className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-foreground">{cb.courseTitle}</p>
                                    <p className="text-xs text-muted-foreground">{cb.present}/{cb.total} sessions</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${cb.percentage >= 75 ? 'bg-emerald-500' : cb.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                            style={{ width: `${cb.percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-foreground w-10 text-right">{cb.percentage}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent history */}
            <div className="rounded-xl border border-border/50 bg-card">
                <div className="p-5 border-b border-border/50">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-violet-600" />
                        Recent History
                    </h2>
                </div>
                <div className="divide-y divide-border/50">
                    {data.attendances.length === 0 ? (
                        <p className="p-6 text-center text-sm text-muted-foreground">No attendance records yet</p>
                    ) : (
                        data.attendances.slice(0, 20).map(a => {
                            const cfg = statusConfig[a.status] || statusConfig.ABSENT;
                            return (
                                <div key={a.id} className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{a.sessionTitle}</p>
                                            <p className="text-xs text-muted-foreground">{a.courseTitle} · {new Date(a.scheduledAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
