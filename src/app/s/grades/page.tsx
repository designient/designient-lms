'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { BarChart3 } from 'lucide-react';

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

export default function StudentGradesPage() {
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ grades: Grade[] }>('/me/grades').then((res) => {
            if (res.success && res.data) setGrades(res.data.grades);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    const getGradeColor = (score: number, max: number) => {
        const pct = (score / max) * 100;
        if (pct >= 90) return 'text-emerald-500 bg-emerald-500/10';
        if (pct >= 70) return 'text-blue-500 bg-blue-500/10';
        if (pct >= 50) return 'text-amber-500 bg-amber-500/10';
        return 'text-destructive bg-destructive/10';
    };

    const averageGrade =
        grades.length > 0
            ? Math.round(
                  grades.reduce(
                      (sum, g) => sum + (g.score / g.submission.assignment.maxScore) * 100,
                      0
                  ) / grades.length
              )
            : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">My Grades</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        View your assignment scores and feedback
                    </p>
                </div>
                {grades.length > 0 && (
                    <div className="rounded-xl border border-border/50 bg-card px-5 py-3 text-center">
                        <p className="text-xs text-muted-foreground mb-0.5">Average</p>
                        <p className="text-2xl font-bold text-foreground">{averageGrade}%</p>
                        <p className="text-[10px] text-muted-foreground">
                            across {grades.length} graded
                        </p>
                    </div>
                )}
            </div>

            {grades.length === 0 ? (
                <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No grades yet</h3>
                    <p className="text-sm text-muted-foreground">
                        Submit assignments to receive grades from instructors.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {grades.map((grade) => (
                        <div
                            key={grade.id}
                            className="rounded-xl border border-border/50 bg-card p-5"
                        >
                            <div className="flex items-start justify-between flex-wrap gap-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-foreground mb-1">
                                        {grade.submission.assignment.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Graded by {grade.grader.name} &middot;{' '}
                                        {new Date(grade.gradedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <span
                                    className={`text-sm font-bold px-3 py-1 rounded-lg ${getGradeColor(
                                        grade.score,
                                        grade.submission.assignment.maxScore
                                    )}`}
                                >
                                    {grade.score} / {grade.submission.assignment.maxScore}
                                </span>
                            </div>
                            {grade.feedback && (
                                <div className="mt-3 p-3 rounded-lg bg-muted/30 border-l-2 border-primary">
                                    <p className="text-[11px] font-semibold text-muted-foreground mb-1">
                                        Feedback
                                    </p>
                                    <p className="text-sm text-foreground leading-relaxed">
                                        {grade.feedback}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
