"use client";

import { useMemo, useState } from "react";
import { useLeads } from "@/hooks/useLeads";
import { useAppStore } from "@/store/useAppStore";
import { daysSince, toWaLink } from "@/lib/format";
import { StageBadge } from "./StageBadge";
import type { Lead } from "@/types";

const TEMPLATES: Record<3 | 5 | 7, string> = {
  3: "Olá! Ainda tem interesse nos uniformes? 😊",
  5: "Temos uma condição especial esta semana 🔥",
  7: "SWIT Uniformes aqui. Seu projeto ainda está em aberto?"
};

function pickTemplate(days: number): { key: 3 | 5 | 7; text: string } {
  if (days >= 7) return { key: 7, text: TEMPLATES[7] };
  if (days >= 5) return { key: 5, text: TEMPLATES[5] };
  return { key: 3, text: TEMPLATES[3] };
}

function colorClass(days: number) {
  if (days >= 7) return { border: "border-stage-5/60", text: "text-stage-5", bg: "bg-stage-5/10" };
  if (days >= 5) return { border: "border-stage-3/60", text: "text-stage-3", bg: "bg-stage-3/10" };
  return { border: "border-stage-2/60", text: "text-stage-2", bg: "bg-stage-2/10" };
}

export function FollowUpList() {
  const { leads, loading } = useLeads();
  const setActiveLeadId = useAppStore((s) => s.setActiveLeadId);
  const pushToast = useAppStore((s) => s.pushToast);
  const [copied, setCopied] = useState<string | null>(null);

  const stale = useMemo(() => {
    return leads
      .filter((l) => l.stage !== 4 && l.stage !== 5 && daysSince(l.updated_at) >= 3)
      .sort((a, b) => daysSince(b.updated_at) - daysSince(a.updated_at));
  }, [leads]);

  async function copyTpl(lead: Lead, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(lead.id);
      pushToast({ message: "Mensagem copiada", variant: "success", ttl: 1500 });
      setTimeout(() => setCopied(null), 1500);
    } catch {
      pushToast({ message: "Não foi possível copiar", variant: "error" });
    }
  }

  return (
    <div className="px-4 md:px-6 py-4 max-w-3xl mx-auto">
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="heading text-xl md:text-2xl">Follow-up</h1>
        <span className="text-xs text-neutral-400">
          {loading ? "..." : `${stale.length} pendentes`}
        </span>
      </div>

      {!loading && stale.length === 0 ? (
        <div className="card p-8 text-center text-sm text-neutral-400">
          ✨ Tudo em dia! Nenhum lead com 3+ dias sem atualização.
        </div>
      ) : (
        <ul className="space-y-3">
          {stale.map((l) => {
            const d = daysSince(l.updated_at);
            const c = colorClass(d);
            const tpl = pickTemplate(d);
            return (
              <li key={l.id} className={`card border ${c.border} ${c.bg} p-4`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <button
                      onClick={() => setActiveLeadId(l.id)}
                      className="font-medium hover:text-accent text-left"
                    >
                      {l.name}
                    </button>
                    {l.company && (
                      <div className="text-xs text-neutral-400 truncate">{l.company}</div>
                    )}
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <StageBadge stage={l.stage} />
                      <span className={`pill ${c.bg} ${c.text} border ${c.border}`}>
                        {d} {d === 1 ? "dia" : "dias"} parado
                      </span>
                    </div>
                  </div>
                  <a
                    href={toWaLink(l.whatsapp)}
                    target="_blank"
                    rel="noreferrer"
                    className="pill bg-stage-4/15 text-stage-4 border border-stage-4/40 hover:bg-stage-4/25 shrink-0"
                  >
                    💬 {l.whatsapp}
                  </a>
                </div>

                <div className="rounded-lg bg-surface-2 border border-border p-3 text-sm">
                  <div className="text-[11px] uppercase text-neutral-500 mb-1">
                    Template sugerido ({tpl.key}d+)
                  </div>
                  <p className="text-neutral-200">{tpl.text}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => copyTpl(l, tpl.text)}
                      className="btn-ghost text-xs py-1.5"
                    >
                      {copied === l.id ? "✓ Copiado" : "Copiar"}
                    </button>
                    <button
                      onClick={() => copyTpl(l, TEMPLATES[3])}
                      className="text-xs text-neutral-400 hover:text-accent"
                    >
                      3d
                    </button>
                    <button
                      onClick={() => copyTpl(l, TEMPLATES[5])}
                      className="text-xs text-neutral-400 hover:text-accent"
                    >
                      5d
                    </button>
                    <button
                      onClick={() => copyTpl(l, TEMPLATES[7])}
                      className="text-xs text-neutral-400 hover:text-accent"
                    >
                      7d+
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
