import React from 'react';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Filter, Calendar } from 'lucide-react';
interface DashboardHeaderProps {
  selectedPeriod: string;
  onPeriodChange: (value: string) => void;
  filterCount: number;
  onFiltersClick: () => void;
}
export function DashboardHeader({
  selectedPeriod,
  onPeriodChange,
  filterCount,
  onFiltersClick
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Dashboard Overview
        </h2>
        <p className="text-sm text-muted-foreground">
          Welcome back, here's what's happening today.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-40">
          <Select
            value={selectedPeriod}
            onChange={(e) => onPeriodChange(e.target.value)}
            options={[
            {
              value: '7d',
              label: 'Last 7 Days'
            },
            {
              value: '30d',
              label: 'Last 30 Days'
            },
            {
              value: 'month',
              label: 'This Month'
            },
            {
              value: 'quarter',
              label: 'Last Quarter'
            }]
            } />

        </div>
        <Button
          variant="outline"
          className="gap-2 relative"
          onClick={onFiltersClick}>

          <Filter className="h-3.5 w-3.5" />
          Filters
          {filterCount > 0 &&
          <Badge
            variant="default"
            className="ml-0.5 h-4 min-w-[16px] px-1 text-[9px] flex items-center justify-center">

              {filterCount}
            </Badge>
          }
        </Button>
      </div>
    </div>);

}