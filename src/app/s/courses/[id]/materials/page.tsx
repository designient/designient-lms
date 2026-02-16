'use client';

import React, { useEffect, useState, use } from 'react';
import { Loader2, FileText, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Material { id: string; title: string; driveUrl: string; position: number; module: { id: string; title: string } | null }

export default function StudentMaterialsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeMaterial, setActiveMaterial] = useState<Material | null>(null);

    useEffect(() => {
        api.get<{ materials: Material[] }>(`/courses/${id}/materials`)
            .then(res => {
                if (res.success && res.data) {
                    setMaterials(res.data.materials);
                    if (res.data.materials.length > 0) setActiveMaterial(res.data.materials[0]);
                }
            })
            .finally(() => setIsLoading(false));
    }, [id]);

    const getPreviewUrl = (url: string) => {
        const match = url.match(/\/d\/([^/]+)/);
        return match ? `https://drive.google.com/file/d/${match[1]}/preview` : url;
    };

    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/s/courses" className="p-2 rounded-lg hover:bg-muted/60 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Class Materials</h1>
                    <p className="text-muted-foreground mt-1">View course materials and documents</p>
                </div>
            </div>

            {materials.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
                    <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No materials available yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* PDF viewer */}
                    <div className="lg:col-span-2">
                        {activeMaterial && (
                            <div>
                                <div className="rounded-xl overflow-hidden border border-border/50 bg-muted/20" style={{ height: '70vh' }}>
                                    <iframe
                                        src={getPreviewUrl(activeMaterial.driveUrl)}
                                        className="w-full h-full border-none"
                                        title={activeMaterial.title}
                                    />
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                    <h2 className="text-lg font-semibold text-foreground">{activeMaterial.title}</h2>
                                    <a href={activeMaterial.driveUrl} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                                        Open in Drive <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Material list */}
                    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                        <div className="p-4 border-b border-border/50">
                            <h3 className="text-sm font-semibold text-foreground">{materials.length} Materials</h3>
                        </div>
                        <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
                            {materials.map((m, i) => (
                                <button
                                    key={m.id}
                                    onClick={() => setActiveMaterial(m)}
                                    className={`w-full text-left p-3 flex items-center gap-3 transition-colors ${activeMaterial?.id === m.id ? 'bg-primary/10' : 'hover:bg-muted/40'}`}
                                >
                                    <span className="text-xs text-muted-foreground w-5 flex-shrink-0">{i + 1}</span>
                                    <FileText className="h-4 w-4 flex-shrink-0 text-blue-500" />
                                    <div className="min-w-0">
                                        <span className="text-sm text-foreground truncate block">{m.title}</span>
                                        {m.module && <span className="text-xs text-muted-foreground">{m.module.title}</span>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
