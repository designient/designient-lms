import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { AlertTriangle, ChevronRight, Clock, BoxIcon } from 'lucide-react';
export type AttentionSeverity = 'critical' | 'warning' | 'info';
export interface UnifiedAttentionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: BoxIcon;
  severity: AttentionSeverity;
  category: string;
  actionLabel: string;
  onAction: () => void;
  timestamp?: string;
}
interface UnifiedAttentionPanelProps {
  items: UnifiedAttentionItem[];
  onViewAll?: () => void;
  maxItems?: number;
}
const severityConfig = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-950/40',
    border: 'border-l-red-500 dark:border-l-red-400',
    iconBg: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
    glow: 'dark:shadow-[0_0_12px_-2px_rgba(239,68,68,0.25)]',
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-l-amber-500 dark:border-l-amber-400',
    iconBg:
    'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
    glow: 'dark:shadow-[0_0_12px_-2px_rgba(245,158,11,0.25)]',
    badge:
    'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
  },
  info: {
    bg: 'bg-primary/5 dark:bg-primary/10',
    border: 'border-l-primary',
    iconBg: 'bg-primary/10 text-primary dark:bg-primary/20',
    glow: 'dark:shadow-[0_0_12px_-2px_rgba(139,92,246,0.2)]',
    badge: 'bg-primary/10 text-primary dark:bg-primary/20'
  }
};
export function UnifiedAttentionPanel({
  items,
  onViewAll,
  maxItems = 6
}: UnifiedAttentionPanelProps) {
  // Sort by severity (critical first, then warning, then info)
  const sortedItems = [...items].sort((a, b) => {
    const order = {
      critical: 0,
      warning: 1,
      info: 2
    };
    return order[a.severity] - order[b.severity];
  });
  const displayItems = sortedItems.slice(0, maxItems);
  const remainingCount = items.length - maxItems;
  const criticalCount = items.filter((i) => i.severity === 'critical').length;
  const warningCount = items.filter((i) => i.severity === 'warning').length;
  return (
    <Card className="overflow-hidden dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)]">
      <CardHeader className="flex flex-row items-center justify-between py-2.5 px-3 border-b border-border/40 bg-muted/30 dark:bg-muted/10">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-xs font-semibold tracking-tight text-foreground">
            Attention Required
          </h3>
          {/* Severity badges */}
          <div className="flex items-center gap-1 ml-1">
            {criticalCount > 0 &&
            <span className="px-1.5 py-0.5 text-[9px] font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                {criticalCount} critical
              </span>
            }
            {warningCount > 0 &&
            <span className="px-1.5 py-0.5 text-[9px] font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                {warningCount} warning
              </span>
            }
          </div>
        </div>
        {onViewAll &&
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-primary h-6 px-1.5 text-[10px]"
          onClick={onViewAll}>

            View All
            <ChevronRight className="ml-0.5 h-3 w-3" />
          </Button>
        }
      </CardHeader>

      <CardContent className="p-0">
        {displayItems.length === 0 ?
        <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-2">
              <svg
              className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">

                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7" />

              </svg>
            </div>
            <p className="text-[13px] font-medium text-foreground">
              All clear!
            </p>
            <p className="text-[11px] text-muted-foreground">
              No items require your attention.
            </p>
          </div> :

        <div className="divide-y divide-border/40">
            {displayItems.map((item) => {
            const config = severityConfig[item.severity];
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 px-3 py-2.5 border-l-2 transition-all cursor-pointer group hover:bg-muted/30 ${config.border} ${config.glow}`}
                onClick={item.onAction}>

                  {/* Icon */}
                  <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.iconBg}`}>

                    <item.icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      <span
                      className={`px-1.5 py-0.5 text-[9px] font-medium rounded ${config.badge}`}>

                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[11px] text-muted-foreground truncate">
                        {item.subtitle}
                      </p>
                      {item.timestamp &&
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/70 flex-shrink-0">
                          <Clock className="h-2.5 w-2.5" />
                          {item.timestamp}
                        </span>
                    }
                    </div>
                  </div>

                  {/* Action */}
                  <Button
                  variant="outline"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-all h-6 text-[10px] px-2 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    item.onAction();
                  }}>

                    {item.actionLabel}
                  </Button>
                </div>);

          })}

            {remainingCount > 0 &&
          <div
            className="px-3 py-2 text-center cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={onViewAll}>

                <span className="text-[11px] text-muted-foreground">
                  +{remainingCount} more items requiring attention
                </span>
              </div>
          }
          </div>
        }
      </CardContent>
    </Card>);

}