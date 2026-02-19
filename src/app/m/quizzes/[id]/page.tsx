'use client';

import React, { useEffect, useState, use } from 'react';
import { Loader2, Plus, ArrowLeft, Trash2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface QuizQuestion {
    id: string;
    position: number;
    points: number;
    questionId: string;
    question: string;
    options: string[];
    correctIndex: number;
    subject: string;
}

interface QuizDetail {
    id: string;
    title: string;
    timeLimit: number | null;
    maxAttempts: number;
    availableFrom: string | null;
    availableUntil: string | null;
    course: { id: string; title: string };
    cohort: { id: string; name: string };
    questions: QuizQuestion[];
    attempts: Array<{ id: string; studentId: string; score: number | null; attemptNo: number; submittedAt: string | null }>;
}

interface BankQuestion {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    subject: string;
}

export default function MentorQuizBuilderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { toast } = useToast();
    const [quiz, setQuiz] = useState<QuizDetail | null>(null);
    const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showBank, setShowBank] = useState(false);

    const fetchQuiz = () => {
        apiClient.get<QuizDetail>(`/api/v1/quizzes/${id}`)
            .then(setQuiz)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    };

    useEffect(() => { fetchQuiz(); }, [id]); // eslint-disable-line

    const loadBank = () => {
        setShowBank(true);
        apiClient.get<{ questions: BankQuestion[] }>('/api/v1/instructor/question-bank?limit=100')
            .then(res => setBankQuestions(res.questions))
            .catch(console.error);
    };

    const addQuestion = async (questionId: string) => {
        try {
            await apiClient.post(`/api/v1/quizzes/${id}/questions`, { questionId, points: 1 });
            toast({ title: 'Added', variant: 'success' });
            fetchQuiz();
        } catch { toast({ title: 'Error', variant: 'error' }); }
    };

    const removeQuestion = async (qqId: string) => {
        try {
            await apiClient.delete(`/api/v1/quizzes/${id}/questions`, { quizQuestionId: qqId });
            fetchQuiz();
        } catch { toast({ title: 'Error', variant: 'error' }); }
    };

    if (isLoading || !quiz) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

    const existingQIds = new Set(quiz.questions.map(q => q.questionId));

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/m/quizzes" className="p-2 rounded-lg hover:bg-muted/60 transition-colors"><ArrowLeft className="h-4 w-4" /></Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-foreground">{quiz.title}</h1>
                    <p className="text-sm text-muted-foreground">{quiz.cohort.name}</p>
                </div>
                <Button onClick={loadBank} className="gap-2"><Plus className="h-4 w-4" /> Add from Bank</Button>
            </div>

            {/* Quiz settings */}
            <div className="rounded-xl border border-border/50 bg-card p-4 flex flex-wrap gap-4 text-sm">
                <span>⏱ Time: {quiz.timeLimit ? `${quiz.timeLimit}m` : 'No limit'}</span>
                <span>🔄 Max attempts: {quiz.maxAttempts}</span>
                <span>📝 Questions: {quiz.questions.length}</span>
                <span>👥 Attempts: {quiz.attempts.length}</span>
            </div>

            {/* Questions */}
            <div className="space-y-3">
                {quiz.questions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
                        <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">No questions added yet. Click &quot;Add from Bank&quot; to pick questions.</p>
                    </div>
                ) : quiz.questions.map((qq, i) => (
                    <div key={qq.id} className="rounded-xl border border-border/50 bg-card p-4">
                        <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-medium text-foreground"><span className="text-muted-foreground mr-2">Q{i + 1}.</span>{qq.question}</p>
                            <button onClick={() => removeQuestion(qq.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-600">
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                            {qq.options.map((opt, oi) => (
                                <span key={oi} className={`text-xs px-2 py-1 rounded ${oi === qq.correctIndex ? 'bg-emerald-500/10 text-emerald-700 font-medium' : 'bg-muted/40 text-muted-foreground'}`}>
                                    {String.fromCharCode(65 + oi)}. {opt}
                                </span>
                            ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-2 block">{qq.points} pt · #{qq.subject}</span>
                    </div>
                ))}
            </div>

            {/* Bank picker overlay */}
            {showBank && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-xl border border-border w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Pick from Question Bank</h2>
                            <Button variant="outline" onClick={() => setShowBank(false)}>Close</Button>
                        </div>
                        {bankQuestions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No questions in bank. Create some first in the Question Bank page.</p>
                        ) : bankQuestions.map(bq => (
                            <div key={bq.id} className={`rounded-lg border p-3 ${existingQIds.has(bq.id) ? 'border-emerald-300 bg-emerald-50/50' : 'border-border/50'}`}>
                                <div className="flex items-start justify-between">
                                    <p className="text-sm text-foreground">{bq.question}</p>
                                    {existingQIds.has(bq.id) ? (
                                        <span className="text-xs text-emerald-600 font-medium">Added</span>
                                    ) : (
                                        <Button size="sm" onClick={() => addQuestion(bq.id)}>Add</Button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-1 mt-2">
                                    {bq.options.map((opt, i) => (
                                        <span key={i} className={`text-xs px-2 py-0.5 rounded ${i === bq.correctIndex ? 'text-emerald-700 font-medium' : 'text-muted-foreground'}`}>
                                            {String.fromCharCode(65 + i)}. {opt}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
