import React from 'react';
import { create } from 'zustand';
import { X } from 'lucide-react';

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  action?: ToastAction;
  durationMs?: number;
  type?: 'info' | 'success' | 'warn' | 'error';
}

interface ToastState {
  toasts: ToastItem[];
  show: (toast: Omit<ToastItem, 'id'>) => string;
  dismiss: (id: string) => void;
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  show: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const item: ToastItem = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, item] }));

    const duration = toast.durationMs ?? 6000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
    return id;
  },
  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export const ToastHost: React.FC = () => {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-card bg-surface p-3.5 shadow-popover border border-border flex items-start justify-between gap-3 animate-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex-1">
            <h4 className="text-sm font-medium text-text leading-tight">{toast.title}</h4>
            {toast.description && (
              <p className="text-xs text-text-muted mt-1 leading-normal">{toast.description}</p>
            )}
            {toast.action && (
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    dismiss(toast.id);
                  }}
                  className={`text-xs px-2.5 py-1 rounded-input font-medium transition-colors ${
                    toast.action.variant === 'primary'
                      ? 'bg-primary text-primary-contrast hover:opacity-90'
                      : 'bg-surface-2 text-text border border-border hover:bg-border/30'
                  }`}
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="text-text-muted hover:text-text p-1 rounded-input hover:bg-surface-2"
            aria-label="Dismiss toast"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
