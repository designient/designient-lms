'use client';

import React, { useEffect, useState, use } from 'react';
import { Loader2, Plus, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface Task {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueAt: string | null;
    notes: string | null;
    position: number;
}

interface StudentOption {
    id: string;
    userId: string;
    user: { name: string; email: string };
}

const priorityColors: Record<string, string> = {
    LOW: 'bg-slate-500/10 text-slate-600',
    MEDIUM: 'bg-blue-500/10 text-blue-600',
    HIGH: 'bg-orange-500/10 text-orange-600',
    URGENT: 'bg-red-500/10 text-red-600',
};

const statusLabels: Record<string, string> = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    IN_REVIEW: 'In Review',
    DONE: 'Done',
};

export default function MentorAssignmentTasksPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { toast } = useToast();
    const [students, setStudents] = useState<StudentOption[]>([]);
    const [activeStudent, setActiveStudent] = useState('');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueAt: '' });

    useEffect(() => {
        apiClient.get<{ students: Array<{ id: string; name: string; email: string }> }>('/api/v1/instructor/students?limit=200')
            .then(res => {
                const list = res.students.map(s => ({ id: s.id, userId: s.id, user: { name: s.name, email: s.email } }));
                setStudents(list);
                if (list.length > 0) setActiveStudent(list[0].userId);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        if (!activeStudent) return;
        apiClient.get<{ tasks: Task[] }>(`/api/v1/assignments/${id}/tasks?studentId=${activeStudent}`)
            .then(res => setTasks(res.tasks))
            .catch(console.error);
    }, [id, activeStudent]);

    const handleAdd = async () => {
        try {
            await apiClient.post(`/api/v1/assignments/${id}/tasks`, {
                studentId: activeStudent,
                title: form.title,
                description: form.description || null,
                priority: form.priority,
                dueAt: form.dueAt || null,
            });
            toast({ title: 'Task created', variant: 'success' });
            setShowAdd(false);
            setForm({ title: '', description: '', priority: 'MEDIUM', dueAt: '' });
            const res = await apiClient.get<{ tasks: Task[] }>(`/api/v1/assignments/${id}/tasks?studentId=${activeStudent}`);
            setTasks(res.tasks);
        } catch { toast({ title: 'Error', variant: 'error' }); }
    };

    const handleDelete = async (taskId: string) => {
        try {
            await apiClient.delete(`/api/v1/assignments/${id}/tasks`, { taskId });
            setTasks(prev => prev.filter(t => t.id !== taskId));
        } catch { toast({ title: 'Error', variant: 'error' }); }
    };

    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/m/submissions" className="p-2 rounded-lg hover:bg-muted/60 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-foreground">Assignment Tasks</h1>
                    <p className="text-muted-foreground text-sm">Create and manage tasks for students</p>
                </div>
                <div className="flex-1" />
                <Button onClick={() => setShowAdd(!showAdd)} className="gap-2"><Plus className="h-4 w-4" /> Add Task</Button>
            </div>

            {/* Student selector */}
            <select value={activeStudent} onChange={e => setActiveStudent(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border/60 bg-background text-sm">
                {students.map(s => <option key={s.userId} value={s.userId}>{s.user.name} ({s.user.email})</option>)}
            </select>

            {showAdd && (
                <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
                    <input type="text" placeholder="Task Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm" />
                    <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm" rows={2} />
                    <div className="grid grid-cols-2 gap-3">
                        <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                            className="px-3 py-2 rounded-lg border border-border/60 bg-background text-sm">
                            <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option><option value="URGENT">Urgent</option>
                        </select>
                        <input type="date" value={form.dueAt} onChange={e => setForm(f => ({ ...f, dueAt: e.target.value }))}
                            className="px-3 py-2 rounded-lg border border-border/60 bg-background text-sm" />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleAdd} disabled={!form.title}>Create</Button>
                        <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                    </div>
                </div>
            )}

            {/* Kanban-style columns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const).map(status => {
                    const columnTasks = tasks.filter(t => t.status === status);
                    return (
                        <div key={status} className="rounded-xl border border-border/50 bg-card">
                            <div className="p-3 border-b border-border/50 flex items-center justify-between">
                                <span className="text-sm font-semibold text-foreground">{statusLabels[status]}</span>
                                <span className="text-xs text-muted-foreground">{columnTasks.length}</span>
                            </div>
                            <div className="p-2 space-y-2 min-h-[120px]">
                                {columnTasks.map(task => (
                                    <div key={task.id} className="rounded-lg border border-border/30 bg-background p-3 space-y-1.5">
                                        <div className="flex items-start justify-between">
                                            <p className="text-sm font-medium text-foreground">{task.title}</p>
                                            <button onClick={() => handleDelete(task.id)} className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-600">
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                        {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityColors[task.priority]}`}>{task.priority}</span>
                                            {task.dueAt && <span className="text-[10px] text-muted-foreground">Due {new Date(task.dueAt).toLocaleDateString()}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
