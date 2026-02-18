'use client';

import React, { useEffect, useState } from 'react';
import { Bell, UserPlus, Flag, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api-client';

interface NotificationItem {
    id: string;
    type: 'info' | 'warning' | 'success';
    title: string;
    description: string;
    time: string;
    userName: string;
    userAvatar: string | null;
}

interface NotificationsPanelProps {
    open: boolean;
    onClose: () => void;
}

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.max(0, now - then);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastReadTime, setLastReadTime] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('notif_last_read') || '';
        }
        return '';
    });

    useEffect(() => {
        if (open && notifications.length === 0) {
            setIsLoading(true);
            apiClient.get<{ notifications: NotificationItem[] }>('/api/v1/notifications')
                .then(res => setNotifications(res.notifications))
                .catch(() => setNotifications([]))
                .finally(() => setIsLoading(false));
        }
    }, [open, notifications.length]);

    const handleMarkAllRead = () => {
        const now = new Date().toISOString();
        setLastReadTime(now);
        if (typeof window !== 'undefined') {
            localStorage.setItem('notif_last_read', now);
        }
    };

    const isRead = (time: string) => {
        if (!lastReadTime) return false;
        return new Date(time) <= new Date(lastReadTime);
    };

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-30" onClick={onClose} aria-hidden="true" />
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-border/50 bg-card shadow-xl z-40">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    <button
                        className="text-xs text-primary hover:text-primary/80 font-medium"
                        onClick={handleMarkAllRead}
                    >
                        Mark all as read
                    </button>
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                    {isLoading ? (
                        <div className="py-8 text-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className="divide-y divide-border/30">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 hover:bg-muted/40 transition-colors ${!isRead(notification.time) ? 'bg-primary/5' : ''}`}
                                >
                                    <div className="flex gap-3">
                                        <div
                                            className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${notification.type === 'success'
                                                ? 'bg-green-100 text-green-600'
                                                : notification.type === 'warning'
                                                    ? 'bg-amber-100 text-amber-600'
                                                    : 'bg-blue-100 text-blue-600'
                                                }`}
                                        >
                                            {notification.type === 'success' && <UserPlus className="h-4 w-4" />}
                                            {notification.type === 'warning' && <Flag className="h-4 w-4" />}
                                            {notification.type === 'info' && <AlertCircle className="h-4 w-4" />}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">{notification.title}</p>
                                            <p className="text-xs text-muted-foreground">{notification.description}</p>
                                            <p className="text-[10px] text-muted-foreground/70 pt-1">
                                                {timeAgo(notification.time)} · {notification.userName}
                                            </p>
                                        </div>
                                        {!isRead(notification.time) && (
                                            <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No new notifications</p>
                        </div>
                    )}
                </div>

                <div className="p-2 border-t border-border/50 bg-muted/20">
                    <Button variant="ghost" size="sm" className="w-full text-xs h-8" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </>
    );
}
