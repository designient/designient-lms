'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';

interface Task {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueAt: string | null;
    notes: string | null;
    assignmentId: string;
}

interface AssignmentGroup {
    assignmentId: string;
    assignmentTitle: string;
    courseTitle: string;
    tasks: Task[];
}

const statusColumns = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const;
const statusLabels: Record<string, string> = { TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done' };
const statusColors: Record<string, string> = {
    TODO: 'border-t-slate-400',
    IN_PROGRESS: 'border-t-blue-500',
    IN_REVIEW: 'border-t-amber-500',
    DONE: 'border-t-emerald-500',
};
const priorityBadge: Record<string, string> = {
    LOW: 'bg-slate-500/10 text-slate-600',
    MEDIUM: 'bg-blue-500/10 text-blue-600',
    HIGH: 'bg-orange-500/10 text-orange-600',
    URGENT: 'bg-red-500/10 text-red-600',
};

export default function StudentTasksPage() {
    const { toast } = useToast();
    const [groups, setGroups] = useState<AssignmentGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeAssignment, setActiveAssignment] = useState('');

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const coursesRes = await apiClient.get<{ courses: { course: { id: string; title: string } }[] }>('/api/v1/me/courses?limit=50');
                if (!coursesRes?.courses) { setIsLoading(false); return; }

                const allGroups: AssignmentGroup[] = [];
                for (const item of coursesRes.courses) {
                    const assignRes = await apiClient.get<{ assignments: Array<{ id: string; title: string }> }>(`/api/v1/courses/${item.course.id}/assignments`);
                    if (!assignRes?.assignments) continue;
                    for (const a of assignRes.assignments) {
                        const taskRes = await apiClient.get<{ tasks: Task[] }>(`/api/v1/assignments/${a.id}/tasks`);
                        if (taskRes?.tasks && taskRes.tasks.length > 0) {
                            allGroups.push({ assignmentId: a.id, assignmentTitle: a.title, courseTitle: item.course.title, tasks: taskRes.tasks });
                        }
                    }
                }
                setGroups(allGroups);
                if (allGroups.length > 0) setActiveAssignment(allGroups[0].assignmentId);
            } catch (err) { console.error(err); }
            setIsLoading(false);
        };
        fetchTasks();
    }, []);

    const handleStatusChange = async (task: Task, newStatus: string) => {
        try {
            const res = await apiClient.put<{ success: boolean }>(`/api/v1/assignments/${task.assignmentId}/tasks`, { taskId: task.id, status: newStatus });
            if (res) {
                setGroups(prev => prev.map(g =>
                    g.assignmentId === task.assignmentId
                        ? { ...g, tasks: g.tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t) }
                        : g
                ));
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to update.', variant: 'error' });
        }
    };

    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

    const activeGroup = groups.find(g => g.assignmentId === activeAssignment);
    const allTasks = activeGroup?.tasks || [];
    const doneCount = allTasks.filter(t => t.status === 'DONE').length;
    const progress = allTasks.length > 0 ? Math.round((doneCount / allTasks.length) * 100) : 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Task Board</h1>
                <p className="text-muted-foreground mt-1">Track your assignment progress</p>
            </div>

            {groups.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
                    <CheckCircle2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No tasks assigned yet</p>
                </div>
            ) : (
                <>
                    {/* Assignment selector */}
                    <div className="flex gap-2 flex-wrap">
                        {groups.map(g => (
                            <button key={g.assignmentId} onClick={() => setActiveAssignment(g.assignmentId)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeAssignment === g.assignmentId ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
                                {g.assignmentTitle}
                            </button>
                        ))}
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-sm font-medium text-foreground">{progress}%</span>
                    </div>

                    {/* Kanban board */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {statusColumns.map(status => {
                            const columnTasks = allTasks.filter(t => t.status === status);
                            return (
                                <div key={status} className={`rounded-xl border border-border/50 bg-card border-t-2 ${statusColors[status]}`}>
                                    <div className="p-3 border-b border-border/50 flex items-center justify-between">
                                        <span className="text-sm font-semibold text-foreground">{statusLabels[status]}</span>
                                        <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{columnTasks.length}</span>
                                    </div>
                                    <div className="p-2 space-y-2 min-h-[120px]">
                                        {columnTasks.map(task => (
                                            <div key={task.id} className="rounded-lg border border-border/30 bg-background p-3 space-y-2">
                                                <p className="text-sm font-medium text-foreground">{task.title}</p>
                                                {task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityBadge[task.priority]}`}>{task.priority}</span>
                                                    {task.dueAt && <span className="text-[10px] text-muted-foreground">Due {new Date(task.dueAt).toLocaleDateString()}</span>}
                                                </div>
                                                {/* Move buttons */}
                                                <div className="flex gap-1 flex-wrap">
                                                    {statusColumns.filter(s => s !== status).map(s => (
                                                        <button key={s} onClick={() => handleStatusChange(task, s)}
                                                            className="text-[10px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                                                            → {statusLabels[s]}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
