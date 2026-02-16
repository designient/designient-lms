'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, BookOpen, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface QuizItem {
    id: string;
    title: string;
    timeLimit: number | null;
    maxAttempts: number;
    courseId: string;
    _count: { questions: number; attempts: number };
    cohort: { name: string };
    attempts?: Array<{ id: string; score: number | null; attemptNo: number; submittedAt: string | null }>;
}

export default function StudentQuizzesPage() {
    const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchQuizzes = async () => {
            const coursesRes = await api.get<{ courses: { course: { id: string; title: string } }[] }>('/me/courses?limit=50');
            if (!coursesRes.success || !coursesRes.data) { setIsLoading(false); return; }

            const all: QuizItem[] = [];
            for (const item of coursesRes.data.courses) {
                const res = await api.get<{ quizzes: QuizItem[] }>(`/courses/${item.course.id}/quizzes`);
                if (res.success && res.data) {
                    for (const q of res.data.quizzes) {
                        const detail = await api.get<QuizItem>(`/quizzes/${q.id}`);
                        if (detail.success && detail.data) all.push(detail.data);
                    }
                }
            }
            setQuizzes(all);
            setIsLoading(false);
        };
        fetchQuizzes();
    }, []);

    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">My Quizzes</h1>
                <p className="text-muted-foreground mt-1">Take quizzes and view your scores</p>
            </div>

            {quizzes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
                    <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No quizzes available</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {quizzes.map(q => {
                        const myAttempts = q.attempts || [];
                        const lastAttempt = myAttempts[0];
                        const hasCompleted = myAttempts.some(a => a.submittedAt);
                        const canRetake = myAttempts.length < q.maxAttempts;

                        return (
                            <div key={q.id} className="rounded-xl border border-border/50 bg-card p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{q.title}</p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                            <span>{q._count.questions} questions</span>
                                            {q.timeLimit && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{q.timeLimit}m</span>}
                                            <span>{q.cohort.name}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {hasCompleted && lastAttempt?.score != null && (
                                            <div className="flex items-center gap-1.5">
                                                {lastAttempt.score > 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                                                <span className="text-sm font-semibold text-foreground">{lastAttempt.score} pts</span>
                                            </div>
                                        )}
                                        {canRetake ? (
                                            <Link href={`/s/quizzes/${q.id}`}
                                                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                                                {hasCompleted ? 'Retake' : 'Start'}
                                            </Link>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Completed</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
