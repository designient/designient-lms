'use client';

import React, { useEffect, useState, use } from 'react';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface StudentRoster {
    id: string;
    userId: string;
    user: { name: string; email: string };
}

interface AttendanceRecord {
    id: string;
    studentId: string;
    status: string;
}

interface SessionDetail {
    id: string;
    title: string;
    scheduledAt: string;
    duration: number;
    course: { id: string; title: string };
    cohort: { id: string; name: string; students: StudentRoster[] };
    attendances: AttendanceRecord[];
}

const STATUS_OPTIONS = [
    { value: 'PRESENT', label: 'Present', color: 'bg-emerald-500 text-white' },
    { value: 'ABSENT', label: 'Absent', color: 'bg-red-500 text-white' },
    { value: 'LATE', label: 'Late', color: 'bg-amber-500 text-white' },
    { value: 'EXCUSED', label: 'Excused', color: 'bg-blue-500 text-white' },
];

export default function MentorAttendanceRosterPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = use(params);
    const { toast } = useToast();
    const [session, setSession] = useState<SessionDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMap, setStatusMap] = useState<Record<string, string>>({});

    useEffect(() => {
        apiClient.get<SessionDetail>(`/api/v1/sessions/${sessionId}`)
            .then(data => {
                setSession(data);
                // Build initial status map from existing attendance
                const map: Record<string, string> = {};
                data.attendances.forEach(a => { map[a.studentId] = a.status; });
                // Default unmarked students to empty
                data.cohort.students.forEach(s => {
                    if (!map[s.userId]) map[s.userId] = '';
                });
                setStatusMap(map);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [sessionId]);

    const handleMarkAll = (status: string) => {
        if (!session) return;
        const newMap: Record<string, string> = {};
        session.cohort.students.forEach(s => { newMap[s.userId] = status; });
        setStatusMap(newMap);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const records = Object.entries(statusMap)
                .filter(([, status]) => status)
                .map(([studentId, status]) => ({ studentId, status }));

            await apiClient.post(`/api/v1/sessions/${sessionId}/attendance`, { records });
            toast({ title: 'Saved', description: `Attendance saved for ${records.length} students.`, variant: 'success' });
        } catch {
            toast({ title: 'Error', description: 'Failed to save attendance.', variant: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!session) {
        return <p className="text-center py-12 text-muted-foreground">Session not found</p>;
    }

    const markedCount = Object.values(statusMap).filter(Boolean).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/m/attendance" className="p-2 rounded-lg hover:bg-muted/60 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-foreground">{session.title}</h1>
                    <p className="text-sm text-muted-foreground">
                        {session.course.title} · {session.cohort.name} · {new Date(session.scheduledAt).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-muted-foreground">Mark all:</span>
                {STATUS_OPTIONS.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => handleMarkAll(opt.value)}
                        className={`px-3 py-1 rounded-md text-xs font-medium ${opt.color} opacity-80 hover:opacity-100 transition-opacity`}
                    >
                        {opt.label}
                    </button>
                ))}
                <div className="flex-1" />
                <span className="text-xs text-muted-foreground">{markedCount}/{session.cohort.students.length} marked</span>
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Attendance
                </Button>
            </div>

            {/* Roster */}
            <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/50">
                {session.cohort.students.map((student) => {
                    const currentStatus = statusMap[student.userId] || '';
                    return (
                        <div key={student.userId} className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500/20 to-violet-500/10 flex items-center justify-center text-xs font-semibold text-violet-700">
                                    {student.user.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">{student.user.name}</p>
                                    <p className="text-xs text-muted-foreground">{student.user.email}</p>
                                </div>
                            </div>
                            <div className="flex gap-1.5">
                                {STATUS_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setStatusMap(prev => ({ ...prev, [student.userId]: opt.value }))}
                                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${currentStatus === opt.value
                                                ? `${opt.color} shadow-sm`
                                                : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
