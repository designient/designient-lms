'use client';

export function LoadingSpinner() {
    return (
        <div className="loading-container">
            <div className="spinner" />
        </div>
    );
}

export function EmptyState({ icon = '📭', title = 'Nothing here yet', message = '' }: {
    icon?: string;
    title?: string;
    message?: string;
}) {
    return (
        <div className="empty-state">
            <span style={{ fontSize: '3rem' }}>{icon}</span>
            <h3>{title}</h3>
            {message && <p>{message}</p>}
        </div>
    );
}

export function ProgressBar({ value }: { value: number }) {
    return (
        <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
        </div>
    );
}
