"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface Toast {
  id: number;
  title: string;
  description?: string;
  variant?: "success" | "error" | "info";
}

export interface ToastContextValue {
  notify(toast: Omit<Toast, "id">): void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((toast: Omit<Toast, "id">) => {
    setToasts((current) => {
      const id = Date.now() + Math.random();
      return [...current, { ...toast, id }];
    });
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) =>
      setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, 5000),
    );
    return () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
    };
  }, [toasts]);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full max-w-md rounded-lg border px-4 py-3 shadow-lg ${variantClass(toast.variant)}`}
            role="status"
            aria-live="polite"
          >
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.description && <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-200">{toast.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function variantClass(variant: Toast["variant"]) {
  switch (variant) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-600/40 dark:bg-emerald-900/40 dark:text-emerald-100";
    case "error":
      return "border-red-200 bg-red-50 text-red-900 dark:border-red-600/40 dark:bg-red-900/40 dark:text-red-100";
    default:
      return "border-neutral-200 bg-white text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";
  }
}
