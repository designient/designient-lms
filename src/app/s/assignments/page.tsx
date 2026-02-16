'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { FileText, Upload, X } from 'lucide-react';

interface Assignment {
    id: string;
    title: string;
    description: string;
    maxScore: number;
    dueAt: string | null;
    isPublished: boolean;
    module: { id: string; title: string } | null;
    _count: { submissions: number };
}

interface CourseAssignments {
    courseId: string;
    courseTitle: string;
    assignments: Assignment[];
}

export default function StudentAssignmentsPage() {
    const [coursesAssignments, setCoursesAssignments] = useState<CourseAssignments[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [notes, setNotes] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            const coursesRes = await api.get<{
                courses: { course: { id: string; title: string } }[];
            }>('/me/courses?limit=50');
            if (coursesRes.success && coursesRes.data) {
                const all: CourseAssignments[] = [];
                for (const item of coursesRes.data.courses) {
                    const assignRes = await api.get<{ assignments: Assignment[] }>(
                        `/courses/${item.course.id}/assignments`
                    );
                    if (assignRes.success && assignRes.data) {
                        all.push({
                            courseId: item.course.id,
                            courseTitle: item.course.title,
                            assignments: assignRes.data.assignments,
                        });
                    }
                }
                setCoursesAssignments(all);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleSubmit = async (assignmentId: string) => {
        if (!file) {
            toast({ title: 'Error', description: 'Please select a file', variant: 'error' });
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        if (notes) formData.append('notes', notes);

        const res = await api.upload(`/assignments/${assignmentId}/submit`, formData);
        if (res.success) {
            toast({ title: 'Submitted', description: 'Assignment submitted successfully!', variant: 'success' });
            setSubmitting(null);
            setFile(null);
            setNotes('');
        } else {
            toast({
                title: 'Error',
                description: (res.error as { message?: string })?.message || 'Submission failed',
                variant: 'error',
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    const allAssignments = coursesAssignments.flatMap((ca) =>
        ca.assignments.map((a) => ({ ...a, courseTitle: ca.courseTitle }))
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Assignments</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    View and submit your course assignments
                </p>
            </div>

            {allAssignments.length === 0 ? (
                <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No assignments</h3>
                    <p className="text-sm text-muted-foreground">
                        Your course assignments will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {allAssignments.map((assignment) => (
                        <div
                            key={assignment.id}
                            className="rounded-xl border border-border/50 bg-card p-5"
                        >
                            <div className="flex items-start justify-between flex-wrap gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground mb-1">
                                        {assignment.courseTitle}
                                        {assignment.module
                                            ? ` • ${assignment.module.title}`
                                            : ''}
                                    </p>
                                    <h3 className="text-sm font-semibold text-foreground mb-1">
                                        {assignment.title}
                                    </h3>
                                    {assignment.description && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {assignment.description}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                                        Max {assignment.maxScore} pts
                                    </span>
                                    {assignment.dueAt && (
                                        <p className="text-[11px] text-muted-foreground mt-1">
                                            Due:{' '}
                                            {new Date(assignment.dueAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {submitting === assignment.id ? (
                                <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/30 space-y-3">
                                    <div>
                                        <label className="text-xs font-medium text-foreground mb-1 block">
                                            Upload File
                                        </label>
                                        <div
                                            className="border-2 border-dashed border-border/60 rounded-lg p-4 text-center cursor-pointer hover:border-primary/40 transition-colors"
                                            onClick={() =>
                                                document
                                                    .getElementById(`file-${assignment.id}`)
                                                    ?.click()
                                            }
                                        >
                                            {file ? (
                                                <p className="text-sm text-foreground">
                                                    📎 {file.name} (
                                                    {(file.size / 1024).toFixed(0)} KB)
                                                </p>
                                            ) : (
                                                <div>
                                                    <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                                                    <p className="text-xs text-muted-foreground">
                                                        Click to select a file (PDF, DOCX, ZIP, images
                                                        — max 10MB)
                                                    </p>
                                                </div>
                                            )}
                                            <input
                                                id={`file-${assignment.id}`}
                                                type="file"
                                                className="hidden"
                                                onChange={(e) =>
                                                    setFile(e.target.files?.[0] || null)
                                                }
                                                accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg,.txt"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-foreground mb-1 block">
                                            Notes (optional)
                                        </label>
                                        <textarea
                                            className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                            rows={2}
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Any notes for the reviewer..."
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                                            onClick={() => handleSubmit(assignment.id)}
                                        >
                                            Submit
                                        </button>
                                        <button
                                            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-border/60 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                                            onClick={() => {
                                                setSubmitting(null);
                                                setFile(null);
                                                setNotes('');
                                            }}
                                        >
                                            <X className="h-3 w-3 mr-1" /> Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
                                    onClick={() => setSubmitting(assignment.id)}
                                >
                                    <Upload className="h-3 w-3" /> Submit Assignment
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
