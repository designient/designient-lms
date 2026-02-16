'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Search, GraduationCap } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/Badge';

interface StudentItem {
    id: string;
    userId: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    phone: string | null;
    status: string;
    cohortId: string | null;
    cohortName: string | null;
}

interface CohortOption {
    id: string;
    name: string;
}

export default function MentorStudentsPage() {
    const [students, setStudents] = useState<StudentItem[]>([]);
    const [cohorts, setCohorts] = useState<CohortOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [cohortFilter, setCohortFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchStudents = () => {
        setIsLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            limit: '12',
            ...(search && { search }),
            ...(cohortFilter && { cohortId: cohortFilter }),
        });
        apiClient.get<{ students: StudentItem[]; cohorts: CohortOption[]; pagination: { totalPages: number } }>(`/api/v1/instructor/students?${params}`)
            .then(res => {
                setStudents(res.students);
                setCohorts(res.cohorts);
                setTotalPages(res.pagination.totalPages);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchStudents();
    }, [page, cohortFilter]);

    useEffect(() => {
        const t = setTimeout(() => { setPage(1); fetchStudents(); }, 300);
        return () => clearTimeout(t);
    }, [search]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">My Students</h1>
                <p className="text-muted-foreground mt-1">Students in your assigned cohorts</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <select
                    value={cohortFilter}
                    onChange={(e) => { setCohortFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2 rounded-lg border border-border/60 bg-background text-sm focus:outline-none"
                >
                    <option value="">All Cohorts</option>
                    {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : students.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
                    <GraduationCap className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No students found</p>
                </div>
            ) : (
                <div className="rounded-xl border border-border/50 bg-card">
                    <div className="divide-y divide-border/50">
                        {students.map((student) => (
                            <div key={student.id} className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center text-xs font-semibold text-emerald-700">
                                        {student.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{student.name}</p>
                                        <p className="text-xs text-muted-foreground">{student.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {student.cohortName && (
                                        <span className="text-xs text-muted-foreground">{student.cohortName}</span>
                                    )}
                                    <Badge variant={student.status === 'ACTIVE' ? 'success' : student.status === 'INVITED' ? 'neutral' : 'warning'}>
                                        {student.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`h-8 w-8 rounded-md text-sm transition-colors ${p === page ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
