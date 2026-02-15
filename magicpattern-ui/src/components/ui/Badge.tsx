import React from 'react';
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
  'default' |
  'secondary' |
  'outline' |
  'success' |
  'warning' |
  'neutral' |
  'destructive';
}
export function Badge({
  className = '',
  variant = 'default',
  ...props
}: BadgeProps) {
  const variants = {
    default:
    'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:border-primary/30',
    secondary: 'bg-secondary text-secondary-foreground border-transparent',
    outline: 'bg-transparent text-foreground border-border',
    success:
    'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30 dark:shadow-[0_0_8px_-2px_rgb(16_185_129/0.3)]',
    warning:
    'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30 dark:shadow-[0_0_8px_-2px_rgb(245_158_11/0.3)]',
    neutral:
    'bg-muted text-muted-foreground border-border/60 dark:bg-muted/50 dark:border-border/40',
    destructive:
    'bg-red-50 text-red-700 border-red-200/60 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30 dark:shadow-[0_0_8px_-2px_rgb(239_68_68/0.3)]'
  };
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium leading-none transition-all ${variants[variant]} ${className}`}
      {...props} />);


}