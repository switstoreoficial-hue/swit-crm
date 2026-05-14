"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import type { UserName } from "@/types";

const USERS: UserName[] = ["Diego", "Kaio", "Admin"];

export function useUser({ requireLogin = true }: { requireLogin?: boolean } = {}) {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user) return;
    const stored = typeof window !== "undefined" ? localStorage.getItem("swit_user") : null;
    if (stored && (USERS as string[]).includes(stored)) {
      setUser(stored as UserName);
    } else if (requireLogin && pathname !== "/login") {
      router.replace("/login");
    }
  }, [user, setUser, requireLogin, router, pathname]);

  return user;
}
