'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Users, BookOpen, Layers, FileText } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface DashboardStats {
    totalCohorts: number;
    activeCohorts: number;
    totalStudents: number;
    pendingSubmissions: number;
    totalCourses: number;
    recentCohorts: Array<{ id: string; name: string; status: string; _count: { students: number } }>;
}

export default function MentorDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        apiClient.get<DashboardStats>('/api/v1/instructor/dashboard')
            .then(setStats)
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

    const statCards = [
        { label: 'Active Cohorts', value: stats?.activeCohorts ?? 0, icon: Layers, color: 'from-violet-500 to-purple-600' },
        { label: 'Total Students', value: stats?.totalStudents ?? 0, icon: Users, color: 'from-emerald-500 to-teal-600' },
        { label: 'Courses', value: stats?.totalCourses ?? 0, icon: BookOpen, color: 'from-blue-500 to-indigo-600' },
        { label: 'Pending Reviews', value: stats?.pendingSubmissions ?? 0, icon: FileText, color: 'from-amber-500 to-orange-600' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Mentor Dashboard</h1>
                <p className="text-muted-foreground mt-1">Overview of your teaching activities</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <div key={card.label} className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{card.label}</span>
                            <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                                <card.icon className="h-4 w-4 text-white" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Recent Cohorts */}
            <div className="rounded-xl border border-border/50 bg-card">
                <div className="p-5 border-b border-border/50 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">Your Cohorts</h2>
                    <Link href="/m/cohorts" className="text-sm text-primary hover:underline">View All</Link>
                </div>
                <div className="divide-y divide-border/50">
                    {(stats?.recentCohorts || []).map((cohort) => (
                        <Link
                            key={cohort.id}
                            href={`/m/cohorts/${cohort.id}`}
                            className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                    <Layers className="h-4 w-4 text-violet-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">{cohort.name}</p>
                                    <p className="text-xs text-muted-foreground">{cohort._count.students} students</p>
                                </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${cohort.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' :
                                    cohort.status === 'UPCOMING' ? 'bg-blue-500/10 text-blue-600' :
                                        'bg-muted text-muted-foreground'
                                }`}>
                                {cohort.status}
                            </span>
                        </Link>
                    ))}
                    {(stats?.recentCohorts || []).length === 0 && (
                        <p className="p-6 text-center text-sm text-muted-foreground">
                            No cohorts assigned yet. Contact your administrator.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
