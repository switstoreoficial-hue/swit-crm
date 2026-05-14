"use client";

import { create } from "zustand";
import type { UserName } from "@/types";

export interface ToastItem {
  id: number;
  message: string;
  action?: { label: string; onClick: () => void };
  variant?: "default" | "success" | "error";
  ttl?: number;
}

interface AppState {
  user: UserName | null;
  setUser: (u: UserName | null) => void;
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
  activeLeadId: string | null;
  setActiveLeadId: (id: string | null) => void;
  toasts: ToastItem[];
  pushToast: (t: Omit<ToastItem, "id">) => void;
  dismissToast: (id: number) => void;
}

let toastId = 0;

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (u) => {
    if (typeof window !== "undefined") {
      if (u) localStorage.setItem("swit_user", u);
      else localStorage.removeItem("swit_user");
    }
    set({ user: u });
  },
  quickAddOpen: false,
  setQuickAddOpen: (open) => set({ quickAddOpen: open }),
  activeLeadId: null,
  setActiveLeadId: (id) => set({ activeLeadId: id }),
  toasts: [],
  pushToast: (t) =>
    set((s) => ({
      toasts: [...s.toasts, { ...t, id: ++toastId, ttl: t.ttl ?? 4500 }]
    })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }))
}));
