"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { UserName } from "@/types";

const USERS: UserName[] = ["Diego", "Kaio", "Admin"];

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);
  const user = useAppStore((s) => s.user);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("swit_user") : null;
    if (stored && (USERS as string[]).includes(stored)) {
      setUser(stored as UserName);
      router.replace("/pipeline");
    }
  }, [router, setUser]);

  useEffect(() => {
    if (user) router.replace("/pipeline");
  }, [user, router]);

  function pick(name: UserName) {
    setUser(name);
    router.replace("/pipeline");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-accent text-black font-heading text-xl font-extrabold">
          SW
        </div>
        <h1 className="heading text-2xl md:text-3xl">
          SWIT <span className="text-accent">Uniformes</span>
        </h1>
        <p className="text-sm text-neutral-400 mt-1">Selecione seu usuário</p>
      </div>

      <div className="grid w-full max-w-sm gap-3">
        {USERS.map((name) => (
          <button
            key={name}
            onClick={() => pick(name)}
            className="card flex items-center gap-3 px-4 py-4 text-left hover:border-accent hover:shadow-glow transition-all"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-black font-heading font-extrabold">
              {name[0]}
            </span>
            <span className="font-medium">
              {name}
              {name === "Diego" && (
                <span className="ml-2 text-xs text-neutral-400">Chicão</span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
