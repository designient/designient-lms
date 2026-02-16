'use client';

import React, { useEffect, useState, use } from 'react';
import { Loader2, Video, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Recording { id: string; title: string; youtubeUrl: string; position: number; module: { id: string; title: string } | null }

export default function StudentRecordingsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeRecording, setActiveRecording] = useState<Recording | null>(null);

    useEffect(() => {
        api.get<{ recordings: Recording[] }>(`/courses/${id}/recordings`)
            .then(res => {
                if (res.success && res.data) {
                    setRecordings(res.data.recordings);
                    if (res.data.recordings.length > 0) setActiveRecording(res.data.recordings[0]);
                }
            })
            .finally(() => setIsLoading(false));
    }, [id]);

    const getEmbedUrl = (url: string) => {
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&\s]+)/);
        return match ? `https://www.youtube.com/embed/${match[1]}` : url;
    };

    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/s/courses" className="p-2 rounded-lg hover:bg-muted/60 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Class Recordings</h1>
                    <p className="text-muted-foreground mt-1">Watch recorded class sessions</p>
                </div>
            </div>

            {recordings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
                    <Video className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No recordings available yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Video player */}
                    <div className="lg:col-span-2">
                        {activeRecording && (
                            <div>
                                <div className="bg-black rounded-xl overflow-hidden aspect-video mb-3">
                                    <iframe
                                        src={getEmbedUrl(activeRecording.youtubeUrl)}
                                        className="w-full h-full border-none"
                                        allowFullScreen
                                        title={activeRecording.title}
                                    />
                                </div>
                                <h2 className="text-lg font-semibold text-foreground">{activeRecording.title}</h2>
                                {activeRecording.module && (
                                    <p className="text-xs text-muted-foreground mt-1">Module: {activeRecording.module.title}</p>
                                )}
                            </div>
                        )}
                    </div>
                    {/* Playlist */}
                    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                        <div className="p-4 border-b border-border/50">
                            <h3 className="text-sm font-semibold text-foreground">{recordings.length} Recordings</h3>
                        </div>
                        <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
                            {recordings.map((r, i) => (
                                <button
                                    key={r.id}
                                    onClick={() => setActiveRecording(r)}
                                    className={`w-full text-left p-3 flex items-center gap-3 transition-colors ${activeRecording?.id === r.id ? 'bg-primary/10' : 'hover:bg-muted/40'}`}
                                >
                                    <span className="text-xs text-muted-foreground w-5 flex-shrink-0">{i + 1}</span>
                                    <Video className="h-4 w-4 flex-shrink-0 text-red-500" />
                                    <span className="text-sm text-foreground truncate">{r.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
