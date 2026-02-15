'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { LoadingSpinner, EmptyState } from '@/components/UI';
import Toast, { showToast } from '@/components/Toast';

interface Submission {
    id: string;
    fileUrl: string;
    notes: string;
    attemptNo: number;
    submittedAt: string;
    status: string;
    student: { id: string; name: string; email: string };
    grade: { score: number; feedback: string } | null;
    assignment: { id: string; title: string; maxScore: number; courseId: string };
}

export default function SubmissionsPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [grading, setGrading] = useState<string | null>(null);
    const [score, setScore] = useState('');
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        // Fetch all submissions via me/submissions proxy;
        // In real app, we'd have a dedicated instructor submissions endpoint
        // For now, fetch from all courses
        api.get<{ submissions: Submission[] }>('/me/submissions?limit=50').then((res) => {
            if (res.success && res.data) setSubmissions(res.data.submissions);
            setLoading(false);
        });
    }, []);

    const handleGrade = async (submissionId: string) => {
        const res = await api.post(`/submissions/${submissionId}/grade`, {
            score: Number(score),
            feedback,
        });
        if (res.success) {
            showToast('success', 'Graded successfully');
            setGrading(null);
            setScore('');
            setFeedback('');
            // Refresh
            const refreshRes = await api.get<{ submissions: Submission[] }>('/me/submissions?limit=50');
            if (refreshRes.success && refreshRes.data) setSubmissions(refreshRes.data.submissions);
        } else {
            showToast('error', res.error?.message || 'Failed');
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <Toast />
            <h1 className="page-title">Submissions</h1>
            <p className="page-subtitle">Review and grade student submissions</p>

            {submissions.length === 0 ? (
                <EmptyState icon="📋" title="No submissions" message="Student submissions will appear here" />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {submissions.map((sub) => (
                        <div key={sub.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{sub.assignment?.title || 'Assignment'}</h3>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                        by {sub.student?.name || 'Student'} • Attempt #{sub.attemptNo} • {new Date(sub.submittedAt).toLocaleDateString()}
                                    </p>
                                    {sub.notes && <p style={{ marginTop: '0.5rem', color: 'var(--color-text-secondary)' }}>{sub.notes}</p>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                    <span className={`badge ${sub.status === 'GRADED' ? 'badge-success' : sub.status === 'RESUBMITTED' ? 'badge-warning' : 'badge-primary'}`}>
                                        {sub.status}
                                    </span>
                                    {sub.grade && (
                                        <span className="badge badge-success">{sub.grade.score}/{sub.assignment?.maxScore}</span>
                                    )}
                                </div>
                            </div>

                            {sub.status !== 'GRADED' && (
                                <>
                                    {grading === sub.id ? (
                                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                                            <div className="form-group">
                                                <label className="form-label">Score (max {sub.assignment?.maxScore})</label>
                                                <input type="number" className="form-input" value={score} onChange={(e) => setScore(e.target.value)} min={0} max={sub.assignment?.maxScore} required />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Feedback</label>
                                                <textarea className="form-textarea" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Comments for the student..." />
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="btn btn-primary btn-sm" onClick={() => handleGrade(sub.id)}>Submit Grade</button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => setGrading(null)}>Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }} onClick={() => setGrading(sub.id)}>
                                            Grade Submission
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
