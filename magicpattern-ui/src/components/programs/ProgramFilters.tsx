import React from 'react';
import { Input } from '../ui/Input';
import { Search } from 'lucide-react';
export type ProgramStatus = 'All' | 'Active' | 'Draft' | 'Archived';
interface ProgramFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeFilter: ProgramStatus;
  onFilterChange: (filter: ProgramStatus) => void;
}
export function ProgramFilters({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange
}: ProgramFiltersProps) {
  const filters: ProgramStatus[] = ['All', 'Active', 'Draft', 'Archived'];
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Filter Tabs */}
      <div className="flex items-center gap-0.5 p-0.5 bg-muted/40 rounded-lg border border-border/40">
        {filters.map((filter) =>
        <button
          key={filter}
          onClick={() => onFilterChange(filter)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${activeFilter === filter ? 'bg-card text-foreground shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>

            {filter}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="w-full sm:w-64">
        <Input
          placeholder="Search programs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          icon={Search} />

      </div>
    </div>);

}