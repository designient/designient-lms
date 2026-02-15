'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';

interface RateStatCardProps {
    title: string;
    rate: string;
    trend: string;
    trendUp: boolean;
    metric1Label: string;
    metric1Value: string;
    metric2Label: string;
    metric2Value: string;
    onClick?: () => void;
}

export function RateStatCard({
    title,
    rate,
    trend,
    trendUp,
    metric1Label,
    metric1Value,
    metric2Label,
    metric2Value,
    onClick,
}: RateStatCardProps) {
    return (
        <Card
            className={`relative overflow-hidden transition-all duration-200 hover:shadow-md ${onClick ? 'cursor-pointer hover:border-primary/30' : ''}`}
            onClick={onClick}
        >
            <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {title}
                    </h3>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex items-baseline gap-3 mb-6">
                    <span className="text-3xl font-bold text-foreground tracking-tight">
                        {rate}
                    </span>
                    <div
                        className={`flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${trendUp
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                            }`}
                    >
                        {trendUp ? (
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                            <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        {trend}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                    <div>
                        <p className="text-[11px] text-muted-foreground mb-0.5">{metric1Label}</p>
                        <p className="text-sm font-semibold text-foreground">{metric1Value}</p>
                    </div>
                    <div>
                        <p className="text-[11px] text-muted-foreground mb-0.5">{metric2Label}</p>
                        <p className="text-sm font-semibold text-foreground">{metric2Value}</p>
                    </div>
                </div>
            </div>
        </Card>
    );
}
