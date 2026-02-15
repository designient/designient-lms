import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
interface LeaderboardItem {
  rank: number;
  name: string;
  avatar?: string;
  score: number;
  trend: 'up' | 'down' | 'neutral';
}
interface LeaderboardPanelProps {
  title: string;
  items: LeaderboardItem[];
}
export function LeaderboardPanel({ title, items }: LeaderboardPanelProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500 fill-yellow-500" />;
      case 2:
        return <Trophy className="h-4 w-4 text-slate-400 fill-slate-400" />;
      case 3:
        return <Trophy className="h-4 w-4 text-amber-700 fill-amber-700" />;
      default:
        return (
          <span className="text-xs font-medium text-muted-foreground w-4 text-center">
            {rank}
          </span>);

    }
  };
  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-emerald-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="divide-y divide-border/50">
          {items.map((item) =>
          <div
            key={item.rank}
            className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">

              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-6">
                  {getRankIcon(item.rank)}
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {item.avatar ?
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="h-full w-full rounded-full object-cover" /> :


                  item.name.
                  split(' ').
                  map((n) => n[0]).
                  join('').
                  substring(0, 2)
                  }
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {item.name}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-foreground">
                  {item.score}
                </span>
                {getTrendIcon(item.trend)}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>);

}