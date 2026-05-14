"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { FloatingAddButton } from "./FloatingAddButton";
import { QuickAddSheet } from "./QuickAddSheet";
import { LeadModal } from "./LeadModal";
import { ToastStack } from "./Toast";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  if (isLogin) {
    return (
      <>
        {children}
        <ToastStack />
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-24 md:pb-8">{children}</main>
      <FloatingAddButton />
      <BottomNav />
      <QuickAddSheet />
      <LeadModal />
      <ToastStack />
    </div>
  );
}
