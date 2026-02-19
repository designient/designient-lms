'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/Badge';

interface CohortDetail {
    id: string;
    name: string;
    status: string;
    programName: string;
    startDate: string;
    endDate: string | null;
    capacity: number;
    studentCount: number;
    students: Array<{ id: string; userId: string; name: string; email: string; avatarUrl: string | null; status: string; phone: string | null }>;
}

export default function MentorCohortDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [cohort, setCohort] = useState<CohortDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        apiClient.get<CohortDetail>(`/api/v1/instructor/cohorts/${id}`)
            .then(setCohort)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!cohort) {
        return <p className="text-center py-12 text-muted-foreground">Cohort not found</p>;
    }

    const statusVariant = cohort.status === 'ACTIVE' ? 'success' : cohort.status === 'UPCOMING' ? 'neutral' : 'secondary';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/m/cohorts" className="p-2 rounded-lg hover:bg-muted/60 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-foreground">{cohort.name}</h1>
                        <Badge variant={statusVariant as 'success' | 'neutral' | 'secondary'}>{cohort.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{cohort.programName}</p>
                </div>
            </div>

            {/* Cohort Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-border/50 bg-card p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{cohort.studentCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Enrolled</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-card p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{cohort.capacity}</p>
                    <p className="text-xs text-muted-foreground mt-1">Capacity</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-card p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{new Date(cohort.startDate).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">Start Date</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-card p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{cohort.endDate ? new Date(cohort.endDate).toLocaleDateString() : '—'}</p>
                    <p className="text-xs text-muted-foreground mt-1">End Date</p>
                </div>
            </div>

            {/* Students Section */}
            <div className="rounded-xl border border-border/50 bg-card">
                <div className="p-5 border-b border-border/50">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5 text-emerald-600" />
                        Students ({cohort.studentCount}/{cohort.capacity})
                    </h2>
                </div>
                <div className="divide-y divide-border/50">
                    {cohort.students.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center text-xs font-semibold text-emerald-700">
                                    {student.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">{student.name}</p>
                                    <p className="text-xs text-muted-foreground">{student.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {student.phone && (
                                    <span className="text-xs text-muted-foreground">{student.phone}</span>
                                )}
                                <Badge variant={student.status === 'ACTIVE' ? 'success' : student.status === 'INVITED' ? 'neutral' : 'warning'}>
                                    {student.status}
                                </Badge>
                            </div>
                        </div>
                    ))}
                    {cohort.students.length === 0 && (
                        <p className="p-6 text-center text-sm text-muted-foreground">No students enrolled</p>
                    )}
                </div>
            </div>
        </div>
    );
}
