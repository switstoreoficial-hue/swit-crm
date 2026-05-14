"use client";

import { SourceBadge } from "./SourceBadge";
import { formatBRL, daysSince } from "@/lib/format";
import type { Lead } from "@/types";

export function LeadCard({
  lead,
  onClick,
  dragHandle
}: {
  lead: Lead;
  onClick?: () => void;
  dragHandle?: React.ReactNode;
}) {
  const days = daysSince(lead.updated_at);
  return (
    <button
      type="button"
      onClick={onClick}
      className="card w-full text-left p-3 hover:border-accent/60 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm truncate">{lead.name}</div>
          {lead.company && (
            <div className="text-xs text-neutral-400 truncate">{lead.company}</div>
          )}
        </div>
        {dragHandle}
      </div>

      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <SourceBadge source={lead.source} />
        {lead.quantity ? (
          <span className="pill bg-surface-2 text-neutral-300 border border-border">
            {lead.quantity} pç
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-400">
          {lead.assigned_to ?? "—"}
        </span>
        <div className="flex items-center gap-2">
          {lead.value != null && (
            <span className="font-medium text-neutral-200">{formatBRL(lead.value)}</span>
          )}
          <span
            className={`text-[11px] ${
              days >= 7 ? "text-stage-5" : days >= 5 ? "text-stage-3" : days >= 3 ? "text-stage-2" : "text-neutral-500"
            }`}
            title="Dias desde a última atualização"
          >
            {days}d
          </span>
        </div>
      </div>
    </button>
  );
}
