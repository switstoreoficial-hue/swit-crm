"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export function ToastStack() {
  const toasts = useAppStore((s) => s.toasts);
  const dismiss = useAppStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 md:bottom-6 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} dismiss={dismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  dismiss
}: {
  toast: ReturnType<typeof useAppStore.getState>["toasts"][number];
  dismiss: (id: number) => void;
}) {
  useEffect(() => {
    const ms = toast.ttl ?? 4500;
    const t = setTimeout(() => dismiss(toast.id), ms);
    return () => clearTimeout(t);
  }, [toast.id, toast.ttl, dismiss]);

  const variantClass =
    toast.variant === "success"
      ? "border-stage-4 text-stage-4"
      : toast.variant === "error"
      ? "border-stage-5 text-stage-5"
      : "border-border text-neutral-100";

  return (
    <div
      role="status"
      className={`pointer-events-auto w-full max-w-sm card border ${variantClass} bg-surface/95 backdrop-blur px-4 py-3 flex items-center gap-3 animate-toastIn shadow-xl`}
    >
      <span className="text-sm flex-1">{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => {
            toast.action?.onClick();
            dismiss(toast.id);
          }}
          className="text-xs font-semibold text-accent hover:text-accent-hover"
        >
          {toast.action.label}
        </button>
      )}
      <button
        aria-label="Fechar"
        onClick={() => dismiss(toast.id)}
        className="text-neutral-500 hover:text-neutral-200 text-sm leading-none"
      >
        ✕
      </button>
    </div>
  );
}
