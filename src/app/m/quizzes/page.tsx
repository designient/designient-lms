'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Plus, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface CourseOption { id: string; title: string }
interface CohortOption { id: string; name: string; courses: CourseOption[] }
interface QuizItem { id: string; title: string; timeLimit: number | null; maxAttempts: number; _count: { questions: number; attempts: number }; cohort: { name: string } }

export default function MentorQuizzesPage() {
    const { toast } = useToast();
    const [cohorts, setCohorts] = useState<CohortOption[]>([]);
    const [activeCohort, setActiveCohort] = useState('');
    const [activeCourse, setActiveCourse] = useState('');
    const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ title: '', timeLimit: '', maxAttempts: '1' });

    useEffect(() => {
        apiClient.get<{ cohorts: CohortOption[] }>('/api/v1/instructor/cohorts')
            .then(res => {
                setCohorts(res.cohorts);
                if (res.cohorts.length > 0) {
                    setActiveCohort(res.cohorts[0].id);
                    if (res.cohorts[0].courses.length > 0) setActiveCourse(res.cohorts[0].courses[0].id);
                }
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        if (!activeCourse) return;
        apiClient.get<{ quizzes: QuizItem[] }>(`/api/v1/courses/${activeCourse}/quizzes?cohortId=${activeCohort}`)
            .then(res => setQuizzes(res.quizzes))
            .catch(console.error);
    }, [activeCourse, activeCohort]);

    const handleCreate = async () => {
        try {
            await apiClient.post(`/api/v1/courses/${activeCourse}/quizzes`, {
                title: form.title,
                cohortId: activeCohort,
                timeLimit: form.timeLimit ? Number(form.timeLimit) : null,
                maxAttempts: Number(form.maxAttempts),
            });
            toast({ title: 'Created', variant: 'success' });
            setShowCreate(false);
            setForm({ title: '', timeLimit: '', maxAttempts: '1' });
            const res = await apiClient.get<{ quizzes: QuizItem[] }>(`/api/v1/courses/${activeCourse}/quizzes?cohortId=${activeCohort}`);
            setQuizzes(res.quizzes);
        } catch { toast({ title: 'Error', variant: 'error' }); }
    };

    const currentCohort = cohorts.find(c => c.id === activeCohort);

    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Quizzes</h1>
                    <p className="text-muted-foreground mt-1">Create and manage course quizzes</p>
                </div>
                <Button onClick={() => setShowCreate(!showCreate)} className="gap-2"><Plus className="h-4 w-4" /> New Quiz</Button>
            </div>

            <div className="flex gap-2 flex-wrap">
                {cohorts.map(c => (
                    <button key={c.id} onClick={() => { setActiveCohort(c.id); if (c.courses.length) setActiveCourse(c.courses[0].id); }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeCohort === c.id ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
                        {c.name}
                    </button>
                ))}
            </div>

            {currentCohort && currentCohort.courses.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                    {currentCohort.courses.map(c => (
                        <button key={c.id} onClick={() => setActiveCourse(c.id)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${activeCourse === c.id ? 'bg-violet-500/10 text-violet-600' : 'text-muted-foreground hover:bg-muted/50'}`}>
                            {c.title}
                        </button>
                    ))}
                </div>
            )}

            {showCreate && (
                <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
                    <input type="text" placeholder="Quiz Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm" />
                    <div className="grid grid-cols-2 gap-3">
                        <input type="number" placeholder="Time limit (minutes, optional)" value={form.timeLimit} onChange={e => setForm(f => ({ ...f, timeLimit: e.target.value }))}
                            className="px-3 py-2 rounded-lg border border-border/60 bg-background text-sm" />
                        <input type="number" placeholder="Max attempts" value={form.maxAttempts} onChange={e => setForm(f => ({ ...f, maxAttempts: e.target.value }))}
                            className="px-3 py-2 rounded-lg border border-border/60 bg-background text-sm" />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleCreate} disabled={!form.title}>Create</Button>
                        <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {quizzes.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
                        <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">No quizzes yet</p>
                    </div>
                ) : quizzes.map(q => (
                    <Link key={q.id} href={`/m/quizzes/${q.id}`}
                        className="block rounded-xl border border-border/50 bg-card p-4 hover:border-primary/30 transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-foreground">{q.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {q._count.questions} questions · {q._count.attempts} attempts · Max {q.maxAttempts} tries
                                    {q.timeLimit && ` · ${q.timeLimit}m`}
                                </p>
                            </div>
                            <span className="text-xs bg-muted/50 px-2 py-1 rounded text-muted-foreground">{q.cohort.name}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
