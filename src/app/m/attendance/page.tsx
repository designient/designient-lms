'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Calendar, Users, Clock, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface CohortOption { id: string; name: string; courses: Array<{ id: string; title: string }> }

interface SessionItem {
    id: string;
    title: string;
    courseTitle: string;
    scheduledAt: string;
    duration: number;
    attendanceCount: number;
    studentCount: number;
}

export default function MentorAttendancePage() {
    const { toast } = useToast();
    const [cohorts, setCohorts] = useState<CohortOption[]>([]);
    const [activeCohort, setActiveCohort] = useState('');
    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ courseId: '', title: '', scheduledAt: '', duration: '60' });

    useEffect(() => {
        apiClient.get<{ cohorts: CohortOption[] }>('/api/v1/instructor/cohorts')
            .then(res => {
                setCohorts(res.cohorts);
                if (res.cohorts.length > 0) setActiveCohort(res.cohorts[0].id);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        if (!activeCohort) return;
        setIsLoading(true);
        apiClient.get<{ sessions: SessionItem[] }>(`/api/v1/cohorts/${activeCohort}/sessions`)
            .then(res => setSessions(res.sessions))
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [activeCohort]);

    const handleCreate = async () => {
        setCreating(true);
        try {
            await apiClient.post(`/api/v1/cohorts/${activeCohort}/sessions`, {
                courseId: form.courseId,
                title: form.title,
                scheduledAt: form.scheduledAt,
                duration: Number(form.duration),
            });
            toast({ title: 'Created', description: 'Session created.', variant: 'success' });
            setShowCreate(false);
            setForm({ courseId: '', title: '', scheduledAt: '', duration: '60' });
            // Refresh
            const res = await apiClient.get<{ sessions: SessionItem[] }>(`/api/v1/cohorts/${activeCohort}/sessions`);
            setSessions(res.sessions);
        } catch {
            toast({ title: 'Error', description: 'Failed to create session.', variant: 'error' });
        } finally {
            setCreating(false);
        }
    };

    const currentCohort = cohorts.find(c => c.id === activeCohort);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
                    <p className="text-muted-foreground mt-1">Manage class sessions and mark attendance</p>
                </div>
                <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
                    <Plus className="h-4 w-4" /> New Session
                </Button>
            </div>

            {/* Cohort tabs */}
            <div className="flex gap-2 flex-wrap">
                {cohorts.map(c => (
                    <button
                        key={c.id}
                        onClick={() => setActiveCohort(c.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeCohort === c.id ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                    >
                        {c.name}
                    </button>
                ))}
            </div>

            {/* Create form */}
            {showCreate && currentCohort && (
                <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
                    <h3 className="text-sm font-semibold">New Class Session</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select
                            value={form.courseId}
                            onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
                            className="px-3 py-2 rounded-lg border border-border/60 bg-background text-sm"
                        >
                            <option value="">Select Course</option>
                            {currentCohort.courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                        <input
                            type="text"
                            placeholder="Session Title"
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            className="px-3 py-2 rounded-lg border border-border/60 bg-background text-sm"
                        />
                        <input
                            type="datetime-local"
                            value={form.scheduledAt}
                            onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                            className="px-3 py-2 rounded-lg border border-border/60 bg-background text-sm"
                        />
                        <input
                            type="number"
                            placeholder="Duration (minutes)"
                            value={form.duration}
                            onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                            className="px-3 py-2 rounded-lg border border-border/60 bg-background text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleCreate} disabled={creating || !form.courseId || !form.title}>
                            {creating ? 'Creating...' : 'Create Session'}
                        </Button>
                        <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                    </div>
                </div>
            )}

            {/* Sessions list */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : sessions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
                    <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No sessions yet. Create one to start tracking attendance.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sessions.map(session => (
                        <Link
                            key={session.id}
                            href={`/m/attendance/${session.id}`}
                            className="block rounded-xl border border-border/50 bg-card p-4 hover:border-primary/30 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{session.title}</p>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                        <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {session.courseTitle}</span>
                                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(session.scheduledAt).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {session.duration}m</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs">
                                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className={session.attendanceCount > 0 ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}>
                                        {session.attendanceCount}/{session.studentCount}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
