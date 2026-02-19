'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Layers, Users } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface CohortItem {
    id: string;
    name: string;
    status: string;
    programName: string;
    startDate: string;
    endDate: string | null;
    studentCount: number;
    capacity: number;
}

export default function MentorCohortsPage() {
    const [cohorts, setCohorts] = useState<CohortItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        apiClient.get<{ cohorts: CohortItem[] }>('/api/v1/instructor/cohorts')
            .then(res => setCohorts(res.cohorts))
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">My Cohorts</h1>
                <p className="text-muted-foreground mt-1">Cohorts you are assigned to mentor</p>
            </div>

            {cohorts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
                    <Layers className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No cohorts assigned yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cohorts.map((cohort) => (
                        <Link
                            key={cohort.id}
                            href={`/m/cohorts/${cohort.id}`}
                            className="rounded-xl border border-border/50 bg-card p-5 space-y-4 hover:border-primary/30 transition-colors group"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                                        {cohort.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1">{cohort.programName}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${cohort.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' :
                                    cohort.status === 'UPCOMING' ? 'bg-blue-500/10 text-blue-600' :
                                        cohort.status === 'COMPLETED' ? 'bg-amber-500/10 text-amber-600' :
                                            'bg-muted text-muted-foreground'
                                    }`}>
                                    {cohort.status}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>{cohort.studentCount}/{cohort.capacity} students</span>
                                </div>
                            </div>

                            {/* Capacity bar */}
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-primary"
                                    style={{ width: `${Math.min(100, (cohort.studentCount / cohort.capacity) * 100)}%` }}
                                />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
