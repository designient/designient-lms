import React from 'react';
import { Card } from '../ui/Card';
import { Sparkline } from './Sparkline';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
    description?: string;
    alert?: boolean;
    sparklineData?: number[];
    sparklineColor?: 'primary' | 'success' | 'warning' | 'danger';
    onClick?: () => void;
}

export function StatCard({
    title,
    value,
    icon: Icon,
    trend,
    trendUp,
    description,
    alert,
    sparklineData,
    sparklineColor = 'primary',
    onClick
}: StatCardProps) {
    return (
        <Card
            className={`relative overflow-hidden transition-all duration-200 ${alert
                    ? 'border-amber-200/60 bg-amber-50/30 dark:border-amber-500/30 dark:bg-amber-950/30 dark:shadow-[0_0_15px_-3px_rgba(245,158,11,0.15)]'
                    : 'hover:border-border dark:hover:border-border/80 dark:hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)]'
                } ${onClick ? 'cursor-pointer hover:border-primary/30 hover:shadow-md' : ''}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={(e) => {
                if (onClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            <div className="p-3 relative z-10">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        {title}
                    </span>
                    <div
                        className={`h-7 w-7 rounded-md flex items-center justify-center transition-all ${alert
                                ? 'bg-amber-100/80 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 dark:shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                                : 'bg-primary/10 text-primary dark:bg-primary/20'
                            }`}
                    >
                        <Icon className="h-3.5 w-3.5" />
                    </div>
                </div>

                <div className="flex items-end justify-between gap-3">
                    <div className="space-y-0.5 flex-1">
                        <div className="text-xl font-bold tracking-tight text-foreground">
                            {value}
                        </div>
                        {(trend || description) && (
                            <p className="text-[11px] text-muted-foreground">
                                {trend && (
                                    <span
                                        className={`font-medium ${trendUp
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-red-500 dark:text-red-400'
                                            }`}
                                    >
                                        {trend}
                                    </span>
                                )}
                                {trend && description && ' '}
                                {description}
                            </p>
                        )}
                    </div>

                    {/* Sparkline */}
                    {sparklineData && sparklineData.length > 1 && (
                        <div className="w-16 flex-shrink-0">
                            <Sparkline
                                data={sparklineData}
                                color={alert ? 'warning' : sparklineColor}
                                height={28}
                            />
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
