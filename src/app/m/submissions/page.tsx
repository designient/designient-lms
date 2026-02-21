'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface SubmissionItem {
    id: string;
    studentName: string;
    studentEmail: string;
    assignmentTitle: string;
    courseName: string;
    status: string;
    submittedAt: string;
    grade: string | null;
    feedback: string | null;
    fileUrl: string | null;
}

export default function MentorSubmissionsPage() {
    const { toast } = useToast();
    const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [gradingId, setGradingId] = useState<string | null>(null);
    const [gradeInput, setGradeInput] = useState('');
    const [feedbackInput, setFeedbackInput] = useState('');

    const fetchSubmissions = useCallback(() => {
        const params = new URLSearchParams({
            page: String(page),
            limit: '12',
            ...(statusFilter && { status: statusFilter }),
        });
        apiClient.get<{ submissions: SubmissionItem[]; pagination: { totalPages: number } }>(`/api/v1/instructor/submissions?${params}`)
            .then(res => {
                setSubmissions(res.submissions);
                setTotalPages(res.pagination.totalPages);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [page, statusFilter]);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    const handleGrade = async (submissionId: string) => {
        try {
            const score = Number(gradeInput);
            if (isNaN(score) || score < 0) {
                toast({ title: 'Invalid Grade', description: 'Please enter a valid numeric score.', variant: 'error' });
                return;
            }
            await apiClient.post(`/api/v1/submissions/${submissionId}/grade`, {
                score,
                feedback: feedbackInput || undefined,
            });
            toast({ title: 'Graded', description: 'Submission has been graded.', variant: 'success' });
            setGradingId(null);
            setGradeInput('');
            setFeedbackInput('');
            setIsLoading(true);
            fetchSubmissions();
        } catch {
            toast({ title: 'Error', description: 'Failed to grade submission.', variant: 'error' });
        }
    };

    const statusIcon = (status: string) => {
        switch (status) {
            case 'SUBMITTED': return <Clock className="h-3.5 w-3.5 text-amber-500" />;
            case 'GRADED': return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
            case 'RESUBMITTED': return <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />;
            default: return null;
        }
    };

    const statusLabel: Record<string, string> = {
        '': 'All',
        'SUBMITTED': 'Pending',
        'GRADED': 'Reviewed',
        'RESUBMITTED': 'Resubmitted',
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Submissions</h1>
                <p className="text-muted-foreground mt-1">Review and grade student submissions</p>
            </div>

            {/* Status filter tabs */}
            <div className="flex gap-2">
                {['', 'SUBMITTED', 'GRADED', 'RESUBMITTED'].map(status => (
                    <button
                        key={status}
                        onClick={() => { setIsLoading(true); setStatusFilter(status); setPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === status ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                    >
                        {statusLabel[status]}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : submissions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
                    <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No submissions found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {submissions.map((sub) => (
                        <div key={sub.id} className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{sub.assignmentTitle}</p>
                                    <p className="text-xs text-muted-foreground">{sub.courseName}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {statusIcon(sub.status)}
                                    <Badge variant={sub.status === 'SUBMITTED' ? 'warning' : sub.status === 'GRADED' ? 'success' : 'neutral'}>
                                        {statusLabel[sub.status] || sub.status}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>By: <strong className="text-foreground">{sub.studentName}</strong></span>
                                <span>·</span>
                                <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                                {sub.grade && (
                                    <>
                                        <span>·</span>
                                        <span>Grade: <strong className="text-foreground">{sub.grade}</strong></span>
                                    </>
                                )}
                            </div>
                            {sub.fileUrl && (
                                <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                                    View Submission File
                                </a>
                            )}

                            {/* Inline grading */}
                            {gradingId === sub.id ? (
                                <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                                    <input
                                        type="number"
                                        min={0}
                                        step={1}
                                        placeholder="Score (e.g., 85)"
                                        value={gradeInput}
                                        onChange={(e) => setGradeInput(e.target.value)}
                                        className="w-full px-3 py-2 rounded-md border border-border/60 bg-background text-sm"
                                    />
                                    <textarea
                                        placeholder="Feedback (optional)"
                                        value={feedbackInput}
                                        onChange={(e) => setFeedbackInput(e.target.value)}
                                        className="w-full px-3 py-2 rounded-md border border-border/60 bg-background text-sm"
                                        rows={2}
                                    />
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleGrade(sub.id)}>Submit Grade</Button>
                                        <Button size="sm" variant="outline" onClick={() => setGradingId(null)}>Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                (sub.status === 'SUBMITTED' || sub.status === 'RESUBMITTED') && (
                                    <Button size="sm" variant="outline" onClick={() => setGradingId(sub.id)}>
                                        Grade
                                    </Button>
                                )
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                            key={p}
                            onClick={() => { setIsLoading(true); setPage(p); }}
                            className={`h-8 w-8 rounded-md text-sm transition-colors ${p === page ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
