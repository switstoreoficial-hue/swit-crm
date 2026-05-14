"use client";

import { stageById } from "@/lib/stages";

export function StageBadge({ stage }: { stage: number }) {
  const s = stageById(stage);
  return (
    <span
      className="pill"
      style={{
        backgroundColor: `${s.hex}22`,
        color: s.hex,
        border: `1px solid ${s.hex}55`
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.hex }} />
      {s.label}
    </span>
  );
}
