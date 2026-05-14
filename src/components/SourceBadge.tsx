"use client";

import type { LeadSource } from "@/types";

const META: Record<LeadSource, { label: string; color: string; bg: string }> = {
  whatsapp:  { label: "WhatsApp",  color: "#22c55e", bg: "#22c55e22" },
  facebook:  { label: "Facebook",  color: "#3b82f6", bg: "#3b82f622" },
  instagram: { label: "Instagram", color: "#ec4899", bg: "#ec489922" }
};

export function SourceBadge({ source }: { source: LeadSource }) {
  const m = META[source];
  return (
    <span
      className="pill"
      style={{ color: m.color, backgroundColor: m.bg, border: `1px solid ${m.color}55` }}
    >
      {m.label}
    </span>
  );
}
