'use client';

import React, { useEffect, useState } from 'react';
import { Search, X, User, Users, Layers, ChevronRight, Command } from 'lucide-react';
import type { PageName } from '@/types';

interface SearchModalProps {
    open: boolean;
    onClose: () => void;
    onNavigate: (page: PageName) => void;
    onSelectEntity?: (type: 'student' | 'mentor' | 'cohort', id: string) => void;
}

interface SearchResult {
    id: string;
    type: 'student' | 'mentor' | 'cohort';
    title: string;
    subtitle: string;
    page: PageName;
}

const mockData: SearchResult[] = [
    { id: 'S-1001', type: 'student', title: 'Emma Thompson', subtitle: 'Spring 2024 Design Systems', page: 'students' },
    { id: 'S-1002', type: 'student', title: 'James Wilson', subtitle: 'Winter 2024 Product Strategy', page: 'students' },
    { id: 'M-001', type: 'mentor', title: 'Sarah Chen', subtitle: 'Design Systems Lead', page: 'mentors' },
    { id: 'M-002', type: 'mentor', title: 'Mike Ross', subtitle: 'Product Designer', page: 'mentors' },
    { id: 'C-2024-001', type: 'cohort', title: 'Spring 2024 Design Systems', subtitle: 'Active • 24 Students', page: 'cohorts' },
    { id: 'C-2024-002', type: 'cohort', title: 'Winter 2024 Product Strategy', subtitle: 'Active • 18 Students', page: 'cohorts' },
];

export function SearchModal({ open, onClose, onNavigate, onSelectEntity }: SearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                document.getElementById('global-search-input')?.focus();
            }, 50);
        } else {
            document.body.style.overflow = 'unset';
            setQuery('');
            setResults([]);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [open]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        const filtered = mockData.filter(
            (item) =>
                item.title.toLowerCase().includes(query.toLowerCase()) ||
                item.subtitle.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered);
    }, [query]);

    const handleSelect = (result: SearchResult) => {
        if (onSelectEntity) {
            onSelectEntity(result.type, result.id);
        } else {
            onNavigate(result.page);
        }
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-card rounded-xl shadow-2xl border border-border/50 overflow-hidden">
                {/* Search Header */}
                <div className="flex items-center border-b border-border/50 px-4 py-3 gap-3">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <input
                        id="global-search-input"
                        type="text"
                        placeholder="Search students, mentors, or cohorts..."
                        className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground/50"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoComplete="off"
                    />
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors">
                        <span className="sr-only">Close</span>
                        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                            <span className="text-xs">ESC</span>
                        </kbd>
                        <X className="h-5 w-5 sm:hidden" />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {query.trim() === '' ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <Command className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">Type to search across the platform</p>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="space-y-1">
                            {results.map((result) => (
                                <button
                                    key={result.id}
                                    onClick={() => handleSelect(result)}
                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors group text-left"
                                >
                                    <div
                                        className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${result.type === 'student'
                                                ? 'bg-blue-50 text-blue-600'
                                                : result.type === 'mentor'
                                                    ? 'bg-purple-50 text-purple-600'
                                                    : 'bg-amber-50 text-amber-600'
                                            }`}
                                    >
                                        {result.type === 'student' && <User className="h-4 w-4" />}
                                        {result.type === 'mentor' && <Users className="h-4 w-4" />}
                                        {result.type === 'cohort' && <Layers className="h-4 w-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">
                            <p className="text-sm">No results found for &quot;{query}&quot;</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-border/50 px-4 py-2 bg-muted/20 flex justify-between items-center text-xs text-muted-foreground">
                    <span>
                        Search <strong>Students</strong>, <strong>Mentors</strong>, and <strong>Cohorts</strong>
                    </span>
                    <div className="hidden sm:flex gap-3">
                        <span className="flex items-center gap-1">
                            <kbd className="h-5 w-5 flex items-center justify-center rounded border bg-background font-sans">↑</kbd>
                            <kbd className="h-5 w-5 flex items-center justify-center rounded border bg-background font-sans">↓</kbd>
                            to navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="h-5 w-8 flex items-center justify-center rounded border bg-background font-sans">↵</kbd>
                            to select
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
