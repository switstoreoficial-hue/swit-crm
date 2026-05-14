"use client";

import { useUser } from "@/hooks/useUser";
import { Dashboard } from "@/components/Dashboard";

export default function DashboardPage() {
  const user = useUser();
  if (!user) return null;
  return <Dashboard />;
}
