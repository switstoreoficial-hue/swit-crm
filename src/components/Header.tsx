"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { useAppStore } from "@/store/useAppStore";

const TABS = [
  { href: "/pipeline", label: "Pipeline" },
  { href: "/followup", label: "Follow-up" },
  { href: "/leads", label: "Leads" },
  { href: "/dashboard", label: "Dashboard" }
];

export function Header() {
  const user = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/pipeline" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-black font-heading text-sm font-extrabold">
            SW
          </span>
          <span className="heading text-sm md:text-base">
            SWIT <span className="text-accent">Uniformes</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {TABS.map((t) => {
            const active = pathname === t.href || pathname.startsWith(t.href + "/");
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-surface-2 text-accent" : "text-neutral-300 hover:bg-surface"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={() => {
                setUser(null);
                router.replace("/login");
              }}
              className="flex items-center gap-2 rounded-lg bg-surface-2 px-2 py-1.5 text-xs hover:bg-border"
              title="Trocar usuário"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-black font-bold">
                {user[0]}
              </span>
              <span className="hidden sm:inline">{user}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
