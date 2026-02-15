import React, { useEffect } from 'react';
import { X } from 'lucide-react';
type DrawerSize = 'sm' | 'md' | 'lg' | 'xl';
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: DrawerSize;
  className?: string;
}
const sizeClasses: Record<DrawerSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl'
};
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className = ''
}: DrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);
  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true" />


      {/* Drawer Panel */}
      <div
        className={`relative z-50 flex h-full w-full flex-col border-l border-border/50 bg-card shadow-xl transition-transform duration-200 ease-out animate-in slide-in-from-right ${sizeClasses[size]} ${className}`}
        role="dialog"
        aria-modal="true">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/50 px-4 py-3">
          <div className="space-y-1">
            {title &&
            <h2 className="text-base font-semibold tracking-tight text-foreground">
                {title}
              </h2>
            }
            {description &&
            <p className="text-xs text-muted-foreground">{description}</p>
            }
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors -mr-1">

            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>

        {/* Footer - Sticky */}
        {footer &&
        <div className="border-t border-border/50 bg-muted/20 px-4 py-3">
            {footer}
          </div>
        }
      </div>
    </div>);

}
// Sub-components for structured content
export function DrawerSection({
  title,
  children,
  className = ''




}: {title?: string;children: React.ReactNode;className?: string;}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {title &&
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      }
      {children}
    </div>);

}
export function DrawerDivider() {
  return <div className="border-t border-border/50 my-5" />;
}