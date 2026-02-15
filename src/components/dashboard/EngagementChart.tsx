'use client';

import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useTheme } from '@/hooks/useTheme';

interface DataPoint {
    date: string;
    value: number;
}

interface EngagementChartProps {
    data: DataPoint[];
    title: string;
}

export function EngagementChart({ data, title }: EngagementChartProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px] p-0 pb-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke={isDark ? '#333' : '#eee'}
                        />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? '#888' : '#666', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? '#888' : '#666', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: isDark ? '#1f2937' : '#fff',
                                borderColor: isDark ? '#374151' : '#e5e7eb',
                                borderRadius: '8px',
                                fontSize: '12px',
                            }}
                            itemStyle={{ color: isDark ? '#fff' : '#000' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
