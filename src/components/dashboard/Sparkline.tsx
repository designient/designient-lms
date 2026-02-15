import React from 'react';

interface SparklineProps {
    data: number[];
    color?: 'primary' | 'success' | 'warning' | 'danger';
    height?: number;
    className?: string;
}

export function Sparkline({
    data,
    color = 'primary',
    height = 24,
    className = ''
}: SparklineProps) {
    if (data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Normalize data to 0-100 range
    const normalized = data.map((v) => ((v - min) / range) * 100);

    // Create SVG path
    const width = 100;
    const points = normalized.map((y, i) => {
        const x = (i / (data.length - 1)) * width;
        const yPos = height - (y / 100) * height;
        return `${x},${yPos}`;
    });

    const linePath = `M ${points.join(' L ')}`;
    const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

    const colorClasses = {
        primary: {
            stroke: 'stroke-primary',
            fill: 'fill-primary/10',
            glow: 'drop-shadow-[0_0_3px_hsl(var(--primary)/0.5)]'
        },
        success: {
            stroke: 'stroke-emerald-500 dark:stroke-emerald-400',
            fill: 'fill-emerald-500/10 dark:fill-emerald-400/10',
            glow: 'drop-shadow-[0_0_3px_rgb(16_185_129/0.5)]'
        },
        warning: {
            stroke: 'stroke-amber-500 dark:stroke-amber-400',
            fill: 'fill-amber-500/10 dark:fill-amber-400/10',
            glow: 'drop-shadow-[0_0_3px_rgb(245_158_11/0.5)]'
        },
        danger: {
            stroke: 'stroke-red-500 dark:stroke-red-400',
            fill: 'fill-red-500/10 dark:fill-red-400/10',
            glow: 'drop-shadow-[0_0_3px_rgb(239_68_68/0.5)]'
        }
    };

    const colors = colorClasses[color];

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className={`w-full ${className}`}
            style={{ height }}
            preserveAspectRatio="none"
        >
            {/* Area fill */}
            <path d={areaPath} className={colors.fill} />
            {/* Line */}
            <path
                d={linePath}
                fill="none"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`${colors.stroke} dark:${colors.glow}`}
            />
            {/* End dot */}
            <circle
                cx={width}
                cy={height - (normalized[normalized.length - 1] / 100) * height}
                r="2"
                className={`${colors.stroke} fill-card`}
                strokeWidth="1.5"
            />
        </svg>
    );
}
