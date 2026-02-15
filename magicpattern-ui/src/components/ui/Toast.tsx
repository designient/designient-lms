import React, { useCallback, useState, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}
interface ToastContextType {
  toast: (props: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}
const ToastContext = createContext<ToastContextType | undefined>(undefined);
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
export function ToastProvider({ children }: {children: React.ReactNode;}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback(
    ({ title, description, variant = 'info' }: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [
      ...prev,
      {
        id,
        title,
        description,
        variant
      }]
      );
      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  return (
    <ToastContext.Provider
      value={{
        toast,
        dismiss
      }}>

      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {toasts.map((t) =>
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        )}
      </div>
    </ToastContext.Provider>);

}
function ToastItem({
  toast,
  onDismiss



}: {toast: Toast;onDismiss: (id: string) => void;}) {
  const icons = {
    success:
    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,

    error: <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />,
    warning:
    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />,

    info: <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
  };
  const styles = {
    success:
    'border-emerald-200/60 dark:border-emerald-500/30 dark:shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]',
    error:
    'border-red-200/60 dark:border-red-500/30 dark:shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]',
    warning:
    'border-amber-200/60 dark:border-amber-500/30 dark:shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)]',
    info: 'border-blue-200/60 dark:border-blue-500/30 dark:shadow-[0_0_15px_-3px_rgba(59,130,246,0.2)]'
  };
  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-3 rounded-lg border bg-card shadow-lg animate-in slide-in-from-right-full duration-300 ${styles[toast.variant || 'info']}`}
      role="alert">

      <div className="flex-shrink-0 mt-0.5">
        {icons[toast.variant || 'info']}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground">{toast.title}</h4>
        {toast.description &&
        <p className="text-xs text-muted-foreground mt-0.5">
            {toast.description}
          </p>
        }
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">

        <X className="h-3.5 w-3.5" />
        <span className="sr-only">Close</span>
      </button>
    </div>);

}