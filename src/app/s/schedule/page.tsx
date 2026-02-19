'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Calendar, Clock, MapPin, Video, BookOpen, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ClassSession {
    id: string;
    title: string;
    scheduledAt: string;
    duration: number;
    notes: string | null;
    course: {
        id: string;
        title: string;
    };
}

export default function StudentSchedulePage() {
    const [sessions, setSessions] = useState<ClassSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ sessions: ClassSession[] }>('/me/schedule')
            .then((res) => {
                if (res.success && res.data) {
                    setSessions(res.data.sessions);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    // Group sessions by date
    const groupedSessions = sessions.reduce((acc, session) => {
        const date = new Date(session.scheduledAt).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        if (!acc[date]) acc[date] = [];
        acc[date].push(session);
        return acc;
    }, {} as Record<string, ClassSession[]>);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Class Schedule</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Your upcoming live sessions and classes
                </p>
            </div>

            {sessions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No upcoming classes</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        There are no scheduled sessions for your cohort at this time. Check back later or contact your instructor.
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedSessions).map(([date, dateSessions]) => (
                        <div key={date} className="space-y-4">
                            <h3 className="sticky top-0 bg-background/95 backdrop-blur py-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50 z-10">
                                {date}
                            </h3>
                            <div className="grid gap-4">
                                {dateSessions.map((session) => {
                                    const startDate = new Date(session.scheduledAt);
                                    const endDate = new Date(startDate.getTime() + session.duration * 60000);
                                    const isOngoing = new Date() >= startDate && new Date() <= endDate;

                                    return (
                                        <div
                                            key={session.id}
                                            className={`rounded-xl border bg-card p-5 transition-all ${isOngoing
                                                ? 'border-primary shadow-[0_0_0_1px_rgba(var(--primary),1)] shadow-primary/20'
                                                : 'border-border/50 hover:border-border'
                                                }`}
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                                                {/* Time Column */}
                                                <div className="flex-shrink-0 flex md:flex-col items-center gap-2 md:gap-1 min-w-[100px]">
                                                    <span className="text-2xl font-bold text-foreground">
                                                        {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground font-medium">
                                                        {session.duration} mins
                                                    </span>
                                                </div>

                                                {/* Divider (Desktop) */}
                                                <div className="hidden md:block w-px h-12 bg-border/50" />

                                                {/* Info Column */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                                                            <BookOpen className="h-3 w-3" />
                                                            {session.course?.title || 'General'}
                                                        </span>
                                                        {isOngoing && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white bg-red-500 px-2 py-0.5 rounded animate-pulse">
                                                                Live Now
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="text-lg font-bold text-foreground mb-1">
                                                        {session.title}
                                                    </h4>
                                                    {session.notes && (
                                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                                            {session.notes}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Action Column */}
                                                <div className="flex-shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-border/50 flex items-center md:flex-col justify-end gap-3">
                                                    {/* Placeholder for Join Button - assumes logic for online/offline */}
                                                    <button
                                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                                                        disabled={!isOngoing && new Date() < startDate}
                                                    >
                                                        <Video className="h-4 w-4" />
                                                        Join Class
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
