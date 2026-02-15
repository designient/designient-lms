import React from 'react';
import { BoxIcon } from 'lucide-react';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: BoxIcon;
}
export function Input({ className = '', icon: Icon, ...props }: InputProps) {
  return (
    <div className="relative">
      {Icon &&
      <Icon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
      }
      <input
        className={`flex h-8 w-full rounded-md border border-border/60 bg-card px-3 py-1 text-sm transition-all duration-150 placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 ${Icon ? 'pl-8' : ''} ${className}`}
        {...props} />

    </div>);

}