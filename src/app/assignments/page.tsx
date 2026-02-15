'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import { LoadingSpinner, EmptyState } from '@/components/UI';
import Toast, { showToast } from '@/components/Toast';
import Link from 'next/link';

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

export default function AssignmentsPage() {
    const [coursesAssignments, setCoursesAssignments] = useState<CourseAssignments[]>([]);
    const [loading, setLoading] = useState(true);
    const { data: session } = useSession();
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        // Fetch enrolled courses then assignments
        const fetchData = async () => {
            const coursesRes = await api.get<{ courses: { course: { id: string; title: string } }[] }>('/me/courses?limit=50');
            if (coursesRes.success && coursesRes.data) {
                const all: CourseAssignments[] = [];
                for (const item of coursesRes.data.courses) {
                    const assignRes = await api.get<{ assignments: Assignment[] }>(`/courses/${item.course.id}/assignments`);
                    if (assignRes.success && assignRes.data) {
                        all.push({ courseId: item.course.id, courseTitle: item.course.title, assignments: assignRes.data.assignments });
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
            showToast('error', 'Please select a file');
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        if (notes) formData.append('notes', notes);

        const res = await api.upload(`/assignments/${assignmentId}/submit`, formData);
        if (res.success) {
            showToast('success', 'Assignment submitted!');
            setSubmitting(null);
            setFile(null);
            setNotes('');
        } else {
            showToast('error', res.error?.message || 'Submission failed');
        }
    };

    if (loading) return <LoadingSpinner />;

    const allAssignments = coursesAssignments.flatMap((ca) =>
        ca.assignments.map((a) => ({ ...a, courseTitle: ca.courseTitle }))
    );

    return (
        <div className="page-container">
            <Toast />
            <h1 className="page-title">Assignments</h1>
            <p className="page-subtitle">View and submit your course assignments</p>

            {allAssignments.length === 0 ? (
                <EmptyState icon="📝" title="No assignments" message="Your course assignments will appear here" />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {allAssignments.map((assignment) => (
                        <div key={assignment.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                        {assignment.courseTitle} {assignment.module ? `• ${assignment.module.title}` : ''}
                                    </p>
                                    <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{assignment.title}</h3>
                                    {assignment.description && (
                                        <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{assignment.description}</p>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span className="badge badge-primary" style={{ marginBottom: '0.5rem', display: 'block' }}>
                                        Max {assignment.maxScore} pts
                                    </span>
                                    {assignment.dueAt && (
                                        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                                            Due: {new Date(assignment.dueAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {submitting === assignment.id ? (
                                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Upload File (required)</label>
                                        <div className="file-upload" onClick={() => document.getElementById(`file-${assignment.id}`)?.click()}>
                                            {file ? (
                                                <p>📎 {file.name} ({(file.size / 1024).toFixed(0)} KB)</p>
                                            ) : (
                                                <p>Click to select or drop a file (PDF, DOCX, ZIP, images — max 10MB)</p>
                                            )}
                                            <input id={`file-${assignment.id}`} type="file" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files?.[0] || null)} accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg,.txt" />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Notes (optional)</label>
                                        <textarea className="form-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes for the reviewer..." />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn btn-primary btn-sm" onClick={() => handleSubmit(assignment.id)}>Submit Assignment</button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => { setSubmitting(null); setFile(null); setNotes(''); }}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <button className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }} onClick={() => setSubmitting(assignment.id)}>
                                    📎 Submit Assignment
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
