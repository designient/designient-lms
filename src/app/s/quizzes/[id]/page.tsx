'use client';

import React, { useEffect, useState, use, useCallback } from 'react';
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface QuizQuestion {
    id: string;
    position: number;
    points: number;
    questionId: string;
    question: string;
    options: string[];
    subject: string;
}

interface QuizData {
    id: string;
    title: string;
    timeLimit: number | null;
    maxAttempts: number;
    course: { title: string };
    cohort: { name: string };
    questions: QuizQuestion[];
    attempts: Array<{ id: string; score: number | null; attemptNo: number; submittedAt: string | null }>;
}

interface QuizResult {
    questionId: string;
    selectedIndex: number;
    correctIndex: number;
    isCorrect: boolean;
    points: number;
}

export default function StudentQuizTakingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { toast } = useToast();
    const [quiz, setQuiz] = useState<QuizData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [attemptId, setAttemptId] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [results, setResults] = useState<{ score: number; totalPoints: number; results: QuizResult[] } | null>(null);

    useEffect(() => {
        api.get<QuizData>(`/quizzes/${id}`)
            .then(res => { if (res.success && res.data) setQuiz(res.data); })
            .finally(() => setIsLoading(false));
    }, [id]);

    const handleSubmit = useCallback(async () => {
        if (!attemptId || !quiz) return;
        setSubmitting(true);
        const answerList = Object.entries(answers).map(([questionId, selectedIndex]) => ({ questionId, selectedIndex }));
        const res = await api.post<{ score: number; totalPoints: number; results: QuizResult[] }>(`/quizzes/${id}/attempt`, { attemptId, answers: answerList });
        if (res.success && res.data) {
            setResults(res.data);
        } else {
            toast({ title: 'Error', description: 'Failed to submit.', variant: 'error' });
        }
        setSubmitting(false);
    }, [attemptId, quiz, answers, id, toast]);

    // Timer
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev !== null && prev <= 1) {
                    handleSubmit();
                    return 0;
                }
                return prev !== null ? prev - 1 : null;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, handleSubmit]);

    const startAttempt = async () => {
        const res = await api.post<{ id: string }>(`/quizzes/${id}/attempt`, {});
        if (res.success && res.data) {
            setAttemptId(res.data.id);
            if (quiz?.timeLimit) setTimeLeft(quiz.timeLimit * 60);
        } else {
            toast({ title: 'Error', description: (res.error as { message?: string })?.message || 'Cannot start quiz.', variant: 'error' });
        }
    };

    if (isLoading || !quiz) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    // Show results
    if (results) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center py-8">
                    <div className={`inline-flex items-center justify-center h-20 w-20 rounded-full mb-4 ${results.score >= results.totalPoints * 0.7 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                        <span className="text-2xl font-bold">{results.score}/{results.totalPoints}</span>
                    </div>
                    <h1 className="text-xl font-bold text-foreground">Quiz Complete</h1>
                    <p className="text-muted-foreground mt-1">{Math.round((results.score / results.totalPoints) * 100)}% correct</p>
                </div>
                {/* Per-question results */}
                {quiz.questions.map((qq, i) => {
                    const r = results.results.find(r => r.questionId === qq.questionId);
                    return (
                        <div key={qq.id} className={`rounded-xl border p-4 ${r?.isCorrect ? 'border-emerald-300 bg-emerald-50/50' : 'border-red-300 bg-red-50/50'}`}>
                            <div className="flex items-start gap-2 mb-2">
                                {r?.isCorrect ? <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" /> : <XCircle className="h-4 w-4 text-red-600 mt-0.5" />}
                                <p className="text-sm font-medium text-foreground">Q{i + 1}. {qq.question}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-1 ml-6">
                                {qq.options.map((opt, oi) => (
                                    <span key={oi} className={`text-xs px-2 py-1 rounded ${oi === r?.correctIndex ? 'bg-emerald-500/20 text-emerald-700 font-medium' :
                                            oi === r?.selectedIndex && !r?.isCorrect ? 'bg-red-500/20 text-red-700 line-through' :
                                                'text-muted-foreground'
                                        }`}>
                                        {String.fromCharCode(65 + oi)}. {opt}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })}
                <div className="text-center">
                    <Link href="/s/quizzes" className="text-sm text-primary hover:underline">Back to Quizzes</Link>
                </div>
            </div>
        );
    }

    // Not started yet
    if (!attemptId) {
        const completedAttempts = quiz.attempts.filter(a => a.submittedAt);
        const canStart = quiz.attempts.length < quiz.maxAttempts;
        return (
            <div className="max-w-lg mx-auto text-center py-12 space-y-4">
                <Link href="/s/quizzes" className="text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4 inline mr-1" />Back</Link>
                <h1 className="text-xl font-bold text-foreground">{quiz.title}</h1>
                <p className="text-sm text-muted-foreground">{quiz.course.title} · {quiz.questions.length} questions</p>
                {quiz.timeLimit && <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><Clock className="h-4 w-4" /> {quiz.timeLimit} minutes</p>}
                {completedAttempts.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                        Previous scores: {completedAttempts.map(a => `${a.score} pts`).join(', ')}
                    </div>
                )}
                {canStart ? (
                    <Button onClick={startAttempt}>Start Quiz</Button>
                ) : (
                    <p className="text-sm text-muted-foreground">Maximum attempts reached ({quiz.maxAttempts})</p>
                )}
            </div>
        );
    }

    // Taking quiz
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur py-3 z-10">
                <h1 className="text-lg font-bold text-foreground">{quiz.title}</h1>
                <div className="flex items-center gap-3">
                    {timeLeft !== null && (
                        <span className={`text-sm font-mono font-medium ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-foreground'}`}>
                            ⏱ {formatTime(timeLeft)}
                        </span>
                    )}
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
                    </Button>
                </div>
            </div>

            {quiz.questions.map((qq, i) => (
                <div key={qq.id} className="rounded-xl border border-border/50 bg-card p-5">
                    <p className="text-sm font-medium text-foreground mb-3">
                        <span className="text-muted-foreground mr-2">Q{i + 1}.</span>{qq.question}
                        <span className="text-xs text-muted-foreground ml-2">({qq.points} pt)</span>
                    </p>
                    <div className="space-y-2">
                        {qq.options.map((opt, oi) => (
                            <button
                                key={oi}
                                onClick={() => setAnswers(prev => ({ ...prev, [qq.questionId]: oi }))}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${answers[qq.questionId] === oi
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted/30 text-foreground hover:bg-muted/60'
                                    }`}
                            >
                                <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            <div className="text-center text-sm text-muted-foreground pb-6">
                {Object.keys(answers).length}/{quiz.questions.length} answered
            </div>
        </div>
    );
}
