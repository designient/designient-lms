'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Video, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface CourseOption { id: string; title: string }
interface Recording { id: string; title: string; youtubeUrl: string; position: number; module: { id: string; title: string } | null }

export default function MentorRecordingsPage() {
    const { toast } = useToast();
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [activeCourse, setActiveCourse] = useState('');
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ title: '', youtubeUrl: '' });

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
        apiClient.get<{ recordings: Recording[] }>(`/api/v1/courses/${activeCourse}/recordings`)
            .then(res => setRecordings(res.recordings))
            .catch(console.error);
    }, [activeCourse]);

    const handleAdd = async () => {
        try {
            await apiClient.post(`/api/v1/courses/${activeCourse}/recordings`, { ...form, position: recordings.length });
            toast({ title: 'Added', description: 'Recording added.', variant: 'success' });
            setShowAdd(false);
            setForm({ title: '', youtubeUrl: '' });
            const res = await apiClient.get<{ recordings: Recording[] }>(`/api/v1/courses/${activeCourse}/recordings`);
            setRecordings(res.recordings);
        } catch { toast({ title: 'Error', description: 'Failed.', variant: 'error' }); }
    };

    const handleDelete = async (recordingId: string) => {
        try {
            await apiClient.delete(`/api/v1/courses/${activeCourse}/recordings`, { recordingId });
            setRecordings(prev => prev.filter(r => r.id !== recordingId));
            toast({ title: 'Deleted', variant: 'success' });
        } catch { toast({ title: 'Error', variant: 'error' }); }
    };

    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

    if (courses.length === 0) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Class Recordings</h1>
                    <p className="text-muted-foreground mt-1">Manage YouTube recordings for your programs</p>
                </div>
                <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
                    <Video className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">No programs linked yet</p>
                    <p className="text-xs text-muted-foreground">Ask your admin to assign programs to your cohorts to start adding recordings.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Class Recordings</h1>
                    <p className="text-muted-foreground mt-1">Manage YouTube recordings for your courses</p>
                </div>
                <Button onClick={() => setShowAdd(!showAdd)} className="gap-2"><Plus className="h-4 w-4" /> Add Recording</Button>
            </div>

            {/* Course tabs */}
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
                    <input type="text" placeholder="Recording Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm" />
                    <input type="url" placeholder="YouTube URL" value={form.youtubeUrl} onChange={e => setForm(f => ({ ...f, youtubeUrl: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-border/60 bg-background text-sm" />
                    <div className="flex gap-2">
                        <Button onClick={handleAdd} disabled={!form.title || !form.youtubeUrl}>Add</Button>
                        <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {recordings.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
                        <Video className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">No recordings yet</p>
                    </div>
                ) : recordings.map(r => (
                    <div key={r.id} className="rounded-xl border border-border/50 bg-card p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                                <Video className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">{r.title}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[300px]">{r.youtubeUrl}</p>
                            </div>
                        </div>
                        <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
