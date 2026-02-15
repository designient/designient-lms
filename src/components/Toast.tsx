'use client';

import { useState } from 'react';

interface ToastMessage {
    id: number;
    type: 'success' | 'error';
    message: string;
}

let toastId = 0;
let globalShowToast: ((type: 'success' | 'error', message: string) => void) | null = null;

export function showToast(type: 'success' | 'error', message: string) {
    globalShowToast?.(type, message);
}

export default function Toast() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    globalShowToast = (type, message) => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    };

    return (
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {toasts.map((t) => (
                <div key={t.id} className={`toast toast-${t.type}`}>
                    {t.message}
                </div>
            ))}
        </div>
    );
}
