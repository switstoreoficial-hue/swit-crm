"use client";

import { useUser } from "@/hooks/useUser";
import { LeadsTable } from "@/components/LeadsTable";

export default function LeadsPage() {
  const user = useUser();
  if (!user) return null;
  return <LeadsTable />;
}
