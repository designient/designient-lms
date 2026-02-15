'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { LoadingSpinner, EmptyState } from '@/components/UI';

interface Grade {
    id: string;
    score: number;
    feedback: string;
    gradedAt: string;
    grader: { name: string };
    submission: {
        assignment: { title: string; maxScore: number; courseId: string };
    };
}

export default function GradesPage() {
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ grades: Grade[] }>('/me/grades').then((res) => {
            if (res.success && res.data) setGrades(res.data.grades);
            setLoading(false);
        });
    }, []);

    if (loading) return <LoadingSpinner />;

    const getGradeClass = (score: number, max: number) => {
        const pct = (score / max) * 100;
        if (pct >= 90) return 'excellent';
        if (pct >= 70) return 'good';
        if (pct >= 50) return 'average';
        return 'poor';
    };

    return (
        <div className="page-container">
            <h1 className="page-title">My Grades</h1>
            <p className="page-subtitle">View your assignment scores and feedback</p>

            {grades.length === 0 ? (
                <EmptyState icon="📊" title="No grades yet" message="Submit assignments to receive grades from instructors" />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {grades.map((grade) => (
                        <div key={grade.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                        {grade.submission.assignment.title}
                                    </h3>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                        Graded by {grade.grader.name} • {new Date(grade.gradedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className={`grade-display ${getGradeClass(grade.score, grade.submission.assignment.maxScore)}`}>
                                    {grade.score} / {grade.submission.assignment.maxScore}
                                </div>
                            </div>
                            {grade.feedback && (
                                <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-primary)' }}>
                                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Feedback</p>
                                    <p style={{ color: 'var(--color-text)', lineHeight: 1.6 }}>{grade.feedback}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
