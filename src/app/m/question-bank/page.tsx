'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Edit3, BookOpen } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface Question {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    subject: string;
}

export default function MentorQuestionBankPage() {
    const { toast } = useToast();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editingId, setEditingId] = useState('');
    const [form, setForm] = useState({ question: '', options: ['', '', '', ''], correctIndex: 0, subject: '' });
    const [search, setSearch] = useState('');

    const fetchQuestions = (s = search) => {
        setIsLoading(true);
        apiClient.get<{ questions: Question[] }>(`/api/v1/instructor/question-bank?limit=100&search=${s}`)
            .then(res => setQuestions(res.questions))
            .catch(console.error)
            .finally(() => setIsLoading(false));
    };

    useEffect(() => { fetchQuestions(); }, []); // eslint-disable-line

    const resetForm = () => { setForm({ question: '', options: ['', '', '', ''], correctIndex: 0, subject: '' }); setShowAdd(false); setEditingId(''); };

    const handleSave = async () => {
        if (!form.question || form.options.some(o => !o)) { toast({ title: 'Fill all fields', variant: 'error' }); return; }
        try {
            if (editingId) {
                await apiClient.put('/api/v1/instructor/question-bank', { id: editingId, ...form });
            } else {
                await apiClient.post('/api/v1/instructor/question-bank', form);
            }
            toast({ title: editingId ? 'Updated' : 'Created', variant: 'success' });
            resetForm();
            fetchQuestions();
        } catch { toast({ title: 'Error', variant: 'error' }); }
    };

    const handleEdit = (q: Question) => {
        setForm({ question: q.question, options: [...q.options], correctIndex: q.correctIndex, subject: q.subject });
        setEditingId(q.id);
        setShowAdd(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await apiClient.delete('/api/v1/instructor/question-bank', { id });
            setQuestions(prev => prev.filter(q => q.id !== id));
        } catch { toast({ title: 'Error', variant: 'error' }); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Question Bank</h1>
                    <p className="text-muted-foreground mt-1">Create and manage reusable MCQ questions</p>
                </div>
                <Button onClick={() => { resetForm(); setShowAdd(true); }} className="gap-2"><Plus className="h-4 w-4" /> New Question</Button>
            </div>

            <input type="text" placeholder="Search questions..." value={search}
                onChange={e => { setSearch(e.target.value); fetchQuestions(e.target.value); }}
                className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm" />

            {showAdd && (
                <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
                    <h3 className="text-sm font-semibold">{editingId ? 'Edit Question' : 'New Question'}</h3>
                    <textarea placeholder="Question text" value={form.question}
                        onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm" rows={2} />
                    <input type="text" placeholder="Subject tag (e.g. Math, Science)" value={form.subject}
                        onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm" />
                    {form.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <input type="radio" name="correct" checked={form.correctIndex === i}
                                onChange={() => setForm(f => ({ ...f, correctIndex: i }))} />
                            <input type="text" placeholder={`Option ${i + 1}`} value={opt}
                                onChange={e => { const opts = [...form.options]; opts[i] = e.target.value; setForm(f => ({ ...f, options: opts })); }}
                                className="flex-1 px-3 py-2 rounded-lg border border-border/60 bg-background text-sm" />
                        </div>
                    ))}
                    <p className="text-xs text-muted-foreground">Select the radio button next to the correct answer</p>
                    <div className="flex gap-2">
                        <Button onClick={handleSave}>{editingId ? 'Update' : 'Create'}</Button>
                        <Button variant="outline" onClick={resetForm}>Cancel</Button>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : questions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
                    <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No questions yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {questions.map(q => (
                        <div key={q.id} className="rounded-xl border border-border/50 bg-card p-4">
                            <div className="flex items-start justify-between mb-2">
                                <p className="text-sm font-medium text-foreground">{q.question}</p>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEdit(q)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Edit3 className="h-3.5 w-3.5" /></button>
                                    <button onClick={() => handleDelete(q.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                                {q.options.map((opt, i) => (
                                    <span key={i} className={`text-xs px-2 py-1 rounded ${i === q.correctIndex ? 'bg-emerald-500/10 text-emerald-700 font-medium' : 'bg-muted/40 text-muted-foreground'}`}>
                                        {String.fromCharCode(65 + i)}. {opt}
                                    </span>
                                ))}
                            </div>
                            {q.subject && <span className="text-[10px] text-primary mt-2 block">#{q.subject}</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
