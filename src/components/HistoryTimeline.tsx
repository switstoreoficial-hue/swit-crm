"use client";

import { shortDate } from "@/lib/format";
import type { LeadHistory } from "@/types";

export function HistoryTimeline({ entries }: { entries: LeadHistory[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-neutral-500">Sem histórico ainda.</p>;
  }
  return (
    <ol className="space-y-3">
      {entries.map((e) => (
        <li key={e.id} className="flex gap-3">
          <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent/15 text-accent text-xs font-bold">
            {e.user_name[0]}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="font-semibold text-neutral-200">{e.user_name}</span>
              <span>•</span>
              <span>{shortDate(e.created_at)}</span>
            </div>
            <p className="text-sm text-neutral-200 mt-0.5 whitespace-pre-wrap break-words">
              {e.text}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
