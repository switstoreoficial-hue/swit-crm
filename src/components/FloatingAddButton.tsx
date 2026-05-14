"use client";

import { useAppStore } from "@/store/useAppStore";

export function FloatingAddButton() {
  const setQuickAddOpen = useAppStore((s) => s.setQuickAddOpen);
  return (
    <button
      onClick={() => setQuickAddOpen(true)}
      aria-label="Adicionar lead"
      className="fixed z-30 right-4 bottom-20 md:bottom-6 grid h-14 w-14 place-items-center rounded-full bg-accent text-black shadow-glow hover:bg-accent-hover active:scale-95 transition-transform"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}
