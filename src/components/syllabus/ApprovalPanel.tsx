'use client';

import { useState } from 'react';
import { Clock3, MessageSquare, GitCompareArrows } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import type { SyllabusDraftMeta } from '@/types/syllabus';

interface DiffMeta {
    modulesAdded: number;
    modulesRemoved: number;
    modulesUpdated: number;
    lessonsAdded: number;
    lessonsRemoved: number;
    lessonsUpdated: number;
    hasChanges: boolean;
}

interface ApprovalPanelProps {
    draft: SyllabusDraftMeta | null;
    diff: DiffMeta | null;
    canApprove: boolean;
    onApprove: () => Promise<void>;
    onReject: (comment: string) => Promise<void>;
}

export function ApprovalPanel({
    draft,
    diff,
    canApprove,
    onApprove,
    onReject,
}: ApprovalPanelProps) {
    const [comment, setComment] = useState('');
    const [busyAction, setBusyAction] = useState<'approve' | 'reject' | null>(null);

    const handleApprove = async () => {
        setBusyAction('approve');
        try {
            await onApprove();
            setComment('');
        } finally {
            setBusyAction(null);
        }
    };

    const handleReject = async () => {
        const trimmed = comment.trim();
        if (!trimmed) return;

        setBusyAction('reject');
        try {
            await onReject(trimmed);
            setComment('');
        } finally {
            setBusyAction(null);
        }
    };

    if (!draft) {
        return (
            <div className="rounded-lg border border-border/50 bg-card p-4 text-sm text-muted-foreground">
                No draft submitted yet.
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-border/50 bg-card p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground">Approval Status</div>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {draft.status}
                </span>
            </div>

            {draft.submittedAt && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5 mt-0.5" />
                    <div>
                        Submitted by {draft.submittedBy?.name || 'Unknown'} on{' '}
                        {new Date(draft.submittedAt).toLocaleString()}
                    </div>
                </div>
            )}

            {diff && (
                <div className="rounded-md border border-border/40 bg-background p-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-2">
                        <GitCompareArrows className="h-3.5 w-3.5" />
                        Draft vs Live
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                        <div>+ Modules: {diff.modulesAdded}</div>
                        <div>- Modules: {diff.modulesRemoved}</div>
                        <div>~ Modules: {diff.modulesUpdated}</div>
                        <div>+ Lessons: {diff.lessonsAdded}</div>
                        <div>- Lessons: {diff.lessonsRemoved}</div>
                        <div>~ Lessons: {diff.lessonsUpdated}</div>
                    </div>
                </div>
            )}

            {draft.reviewComment && (
                <div className="rounded-md border border-amber-200/60 bg-amber-50/50 p-3 text-xs text-amber-900">
                    <div className="flex items-center gap-1.5 font-medium mb-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Feedback
                    </div>
                    <p>{draft.reviewComment}</p>
                </div>
            )}

            {canApprove && draft.status === 'PENDING_APPROVAL' && (
                <div className="space-y-2 border-t border-border/40 pt-3">
                    <Textarea
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        placeholder="Required when rejecting"
                        rows={3}
                    />
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleApprove}
                            disabled={busyAction !== null}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {busyAction === 'approve' ? 'Approving...' : 'Approve'}
                        </Button>
                        <Button
                            onClick={handleReject}
                            disabled={busyAction !== null || !comment.trim()}
                            variant="destructive"
                        >
                            {busyAction === 'reject' ? 'Rejecting...' : 'Reject'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
