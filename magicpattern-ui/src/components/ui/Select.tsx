import React from 'react';
import { ChevronDown } from 'lucide-react';
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: {
    value: string;
    label: string;
  }[];
  placeholder?: string;
}
export function Select({
  className = '',
  options,
  placeholder,
  ...props
}: SelectProps) {
  return (
    <div className="relative">
      <select
        className={`flex h-8 w-full appearance-none rounded-md border border-border/60 bg-card px-3 py-1 text-sm transition-all duration-150 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}>

        {placeholder &&
        <option value="" disabled>
            {placeholder}
          </option>
        }
        {options.map((option) =>
        <option key={option.value} value={option.value}>
            {option.label}
          </option>
        )}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
    </div>);

}