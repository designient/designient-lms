import React from 'react';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}
export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-muted/60 hover:text-foreground text-muted-foreground',
    outline:
    'border border-border/60 bg-transparent hover:bg-muted/50 hover:border-border text-foreground',
    destructive:
    'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm'
  };
  const sizes = {
    sm: 'h-7 px-2.5 text-xs gap-1.5',
    md: 'h-8 px-3 text-sm gap-1.5',
    lg: 'h-9 px-4 text-sm gap-2',
    icon: 'h-8 w-8 p-0'
  };
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props} />);


}