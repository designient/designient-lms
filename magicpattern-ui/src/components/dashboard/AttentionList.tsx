import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { ArrowRight, BoxIcon } from 'lucide-react';
export interface AttentionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: BoxIcon;
  iconColor?: string;
  actionLabel?: string;
  onAction?: () => void;
}
interface AttentionListProps {
  title: string;
  items: AttentionItem[];
  onViewAll?: () => void;
  actionLabel?: string;
}
export function AttentionList({
  title,
  items,
  onViewAll,
  actionLabel = 'View All'
}: AttentionListProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between py-2 px-3 border-b border-border/40">
        <h3 className="text-xs font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        {onViewAll &&
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-primary h-6 px-1.5 text-[10px]"
          onClick={onViewAll}>

            {actionLabel}
            <ArrowRight className="ml-0.5 h-3 w-3" />
          </Button>
        }
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {items.length === 0 ?
        <div className="flex items-center justify-center h-20 text-[11px] text-muted-foreground">
            No items requiring attention.
          </div> :

        <div className="divide-y divide-border/40">
            {items.map((item) =>
          <div
            key={item.id}
            className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/30 transition-colors group cursor-pointer"
            onClick={item.onAction}>

                <div
              className={`h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0 ${item.iconColor || 'bg-muted text-muted-foreground'}`}>

                  <item.icon className="h-3.5 w-3.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground truncate leading-tight">
                    {item.subtitle}
                  </p>
                </div>

                {item.actionLabel &&
            <Button
              variant="outline"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 text-[10px] px-1.5"
              onClick={(e) => {
                e.stopPropagation();
                item.onAction?.();
              }}>

                    {item.actionLabel}
                  </Button>
            }
              </div>
          )}
          </div>
        }
      </CardContent>
    </Card>);

}