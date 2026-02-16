'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Plus, FileText, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface CourseOption { id: string; title: string }
interface Material { id: string; title: string; driveUrl: string; position: number; module: { id: string; title: string } | null }

export default function MentorMaterialsPage() {
    const { toast } = useToast();
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [activeCourse, setActiveCourse] = useState('');
    const [materials, setMaterials] = useState<Material[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ title: '', driveUrl: '' });

    useEffect(() => {
        apiClient.get<{ cohorts: Array<{ courses: CourseOption[] }> }>('/api/v1/instructor/cohorts')
            .then(res => {
                const allCourses = new Map<string, CourseOption>();
                res.cohorts.forEach(c => c.courses.forEach(course => allCourses.set(course.id, course)));
                const list = Array.from(allCourses.values());
                setCourses(list);
                if (list.length > 0) setActiveCourse(list[0].id);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        if (!activeCourse) return;
        apiClient.get<{ materials: Material[] }>(`/api/v1/courses/${activeCourse}/materials`)
            .then(res => setMaterials(res.materials))
            .catch(console.error);
    }, [activeCourse]);

    const handleAdd = async () => {
        try {
            await apiClient.post(`/api/v1/courses/${activeCourse}/materials`, { ...form, position: materials.length });
            toast({ title: 'Added', description: 'Material added.', variant: 'success' });
            setShowAdd(false);
            setForm({ title: '', driveUrl: '' });
            const res = await apiClient.get<{ materials: Material[] }>(`/api/v1/courses/${activeCourse}/materials`);
            setMaterials(res.materials);
        } catch { toast({ title: 'Error', description: 'Failed.', variant: 'error' }); }
    };

    const handleDelete = async (materialId: string) => {
        try {
            await apiClient.delete(`/api/v1/courses/${activeCourse}/materials`, { materialId });
            setMaterials(prev => prev.filter(m => m.id !== materialId));
            toast({ title: 'Deleted', variant: 'success' });
        } catch { toast({ title: 'Error', variant: 'error' }); }
    };

    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Class Materials</h1>
                    <p className="text-muted-foreground mt-1">Manage Google Drive materials for your courses</p>
                </div>
                <Button onClick={() => setShowAdd(!showAdd)} className="gap-2"><Plus className="h-4 w-4" /> Add Material</Button>
            </div>

            <div className="flex gap-2 flex-wrap">
                {courses.map(c => (
                    <button key={c.id} onClick={() => setActiveCourse(c.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeCourse === c.id ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
                        {c.title}
                    </button>
                ))}
            </div>

            {showAdd && (
                <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
                    <input type="text" placeholder="Material Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm" />
                    <input type="url" placeholder="Google Drive URL" value={form.driveUrl} onChange={e => setForm(f => ({ ...f, driveUrl: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm" />
                    <div className="flex gap-2">
                        <Button onClick={handleAdd} disabled={!form.title || !form.driveUrl}>Add</Button>
                        <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {materials.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
                        <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">No materials yet</p>
                    </div>
                ) : materials.map(m => (
                    <div key={m.id} className="rounded-xl border border-border/50 bg-card p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <FileText className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">{m.title}</p>
                                <a href={m.driveUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block max-w-[300px]">{m.driveUrl}</a>
                            </div>
                        </div>
                        <button onClick={() => handleDelete(m.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
