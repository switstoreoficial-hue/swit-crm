"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase";
import { useLeadHistory } from "@/hooks/useLeadHistory";
import { STAGES, stageById } from "@/lib/stages";
import { maskWhatsApp, toWaLink, formatBRL } from "@/lib/format";
import { SourceBadge } from "./SourceBadge";
import { Checklist } from "./Checklist";
import { HistoryTimeline } from "./HistoryTimeline";
import { ProductCalculator } from "./ProductCalculator";
import type { Lead, LeadSource } from "@/types";

export function LeadModal() {
  const activeLeadId = useAppStore((s) => s.activeLeadId);
  const setActiveLeadId = useAppStore((s) => s.setActiveLeadId);
  const user = useAppStore((s) => s.user);
  const pushToast = useAppStore((s) => s.pushToast);

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<Partial<Lead>>({});
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const { entries, refresh: refreshHistory } = useLeadHistory(activeLeadId);

  useEffect(() => {
    if (!activeLeadId) {
      setLead(null);
      setDraft({});
      setNote("");
      return;
    }
    let alive = true;
    setLoading(true);
    supabase()
      .from("leads")
      .select("*")
      .eq("id", activeLeadId)
      .single()
      .then(({ data, error }) => {
        if (!alive) return;
        setLoading(false);
        if (error || !data) {
          pushToast({ message: "Lead não encontrado", variant: "error" });
          setActiveLeadId(null);
          return;
        }
        setLead(data as Lead);
        setDraft({});
      });
    return () => {
      alive = false;
    };
  }, [activeLeadId, pushToast, setActiveLeadId]);

  useEffect(() => {
    if (!activeLeadId) return;
    const channel = supabase()
      .channel(`lead-${activeLeadId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leads", filter: `id=eq.${activeLeadId}` },
        (payload) => {
          setLead(payload.new as Lead);
        }
      )
      .subscribe();
    return () => {
      supabase().removeChannel(channel);
    };
  }, [activeLeadId]);

  const merged: Lead | null = useMemo(
    () => (lead ? { ...lead, ...draft } : null),
    [lead, draft]
  );

  function set<K extends keyof Lead>(key: K, val: Lead[K]) {
    setDraft((d) => ({ ...d, [key]: val }));
  }

  async function persist(extra?: Partial<Lead>, historyText?: string) {
    if (!lead) return;
    const patch = { ...draft, ...(extra ?? {}) };
    if (Object.keys(patch).length === 0 && !historyText) return;
    setSaving(true);
    const { data, error } = await supabase()
      .from("leads")
      .update(patch)
      .eq("id", lead.id)
      .select()
      .single();
    if (error || !data) {
      pushToast({ message: `Erro ao salvar: ${error?.message ?? ""}`, variant: "error" });
      setSaving(false);
      return;
    }
    if (historyText) {
      await supabase().from("lead_history").insert({
        lead_id: lead.id,
        user_name: user ?? "Sistema",
        text: historyText
      });
      refreshHistory();
    }
    setLead(data as Lead);
    setDraft({});
    setSaving(false);
    pushToast({ message: "Lead atualizado", variant: "success", ttl: 1800 });
  }

  async function changeStage(newStage: number) {
    if (!merged || merged.stage === newStage) return;
    const fromLabel = stageById(merged.stage).label;
    const toLabel = stageById(newStage).label;
    await persist(
      { stage: newStage as Lead["stage"] },
      `Stage alterado: ${fromLabel} → ${toLabel}`
    );
  }

  async function addNote() {
    if (!lead || !note.trim()) return;
    await supabase().from("lead_history").insert({
      lead_id: lead.id,
      user_name: user ?? "Sistema",
      text: note.trim()
    });
    setNote("");
    refreshHistory();
  }

  async function removeLead() {
    if (!lead) return;
    if (!confirm(`Excluir lead "${lead.name}"? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase().from("leads").delete().eq("id", lead.id);
    if (error) {
      pushToast({ message: `Erro ao excluir: ${error.message}`, variant: "error" });
      return;
    }
    pushToast({ message: "Lead excluído", variant: "success" });
    setActiveLeadId(null);
  }

  if (!activeLeadId) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-stretch md:items-center md:justify-center" aria-modal>
      <button
        aria-label="Fechar"
        onClick={() => setActiveLeadId(null)}
        className="absolute inset-0 bg-black/70 animate-fadeIn"
      />
      <div className="relative w-full md:max-w-3xl md:max-h-[92vh] mt-auto md:mt-0 card md:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden animate-slideUp md:animate-fadeIn">
        {loading || !merged ? (
          <div className="flex items-center justify-center p-10 text-neutral-400">Carregando...</div>
        ) : (
          <>
            <header className="flex items-start justify-between gap-3 border-b border-border p-4 md:p-5">
              <div className="min-w-0 flex-1">
                <input
                  value={merged.name}
                  onChange={(e) => set("name", e.target.value)}
                  onBlur={() => merged.name !== lead?.name && persist({}, `Nome alterado para "${merged.name}"`)}
                  className="w-full bg-transparent text-lg md:text-xl heading focus:outline-none"
                />
                {(merged.company || draft.company !== undefined) && (
                  <input
                    value={merged.company ?? ""}
                    onChange={(e) => set("company", e.target.value || null)}
                    onBlur={() => merged.company !== lead?.company && persist()}
                    placeholder="Empresa"
                    className="w-full bg-transparent text-sm text-neutral-400 focus:outline-none mt-1"
                  />
                )}
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <SourceBadge source={merged.source} />
                  <a
                    href={toWaLink(merged.whatsapp)}
                    target="_blank"
                    rel="noreferrer"
                    className="pill bg-stage-4/15 text-stage-4 border border-stage-4/40 hover:bg-stage-4/25"
                  >
                    💬 Abrir WhatsApp
                  </a>
                </div>
              </div>
              <button
                onClick={() => setActiveLeadId(null)}
                className="text-neutral-400 hover:text-neutral-100 text-xl leading-none"
                aria-label="Fechar"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-6">
              <section>
                <h3 className="field-label">Estágio</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {STAGES.map((s) => {
                    const active = merged.stage === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => changeStage(s.id)}
                        className="rounded-lg px-2 py-2 text-xs font-medium border-2 transition-colors"
                        style={{
                          borderColor: active ? s.hex : "#2a2a2a",
                          background: active ? `${s.hex}1f` : "#161616",
                          color: active ? s.hex : "#d4d4d4"
                        }}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">WhatsApp</label>
                  <input
                    type="tel"
                    value={merged.whatsapp}
                    onChange={(e) => set("whatsapp", maskWhatsApp(e.target.value))}
                    onBlur={() => merged.whatsapp !== lead?.whatsapp && persist()}
                    className="input"
                  />
                </div>
                <div>
                  <label className="field-label">Empresa</label>
                  <input
                    value={merged.company ?? ""}
                    onChange={(e) => set("company", e.target.value || null)}
                    onBlur={() => merged.company !== lead?.company && persist()}
                    className="input"
                  />
                </div>
                <div>
                  <label className="field-label">Origem</label>
                  <select
                    value={merged.source}
                    onChange={(e) => {
                      const v = e.target.value as LeadSource;
                      set("source", v);
                      persist({ source: v });
                    }}
                    className="input"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Responsável</label>
                  <select
                    value={merged.assigned_to ?? ""}
                    onChange={(e) => {
                      const v = e.target.value || null;
                      set("assigned_to", v);
                      persist({ assigned_to: v });
                    }}
                    className="input"
                  >
                    <option value="">—</option>
                    <option value="Diego">Diego (Chicão)</option>
                    <option value="Kaio">Kaio</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Nº Pedido Tiny</label>
                  <input
                    value={merged.tiny_order ?? ""}
                    onChange={(e) => set("tiny_order", e.target.value || null)}
                    onBlur={() => merged.tiny_order !== lead?.tiny_order && persist()}
                    className="input"
                    placeholder="Ex: 12345"
                  />
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={merged.logo_received}
                      onChange={(e) => persist({ logo_received: e.target.checked })}
                      className="h-4 w-4 accent-[#f5c842]"
                    />
                    Logo recebido
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={merged.mockup_sent}
                      onChange={(e) => persist({ mockup_sent: e.target.checked })}
                      className="h-4 w-4 accent-[#f5c842]"
                    />
                    Mockup enviado
                  </label>
                </div>
              </section>

              <section>
                <h3 className="field-label">Produto & Valor</h3>
                <ProductCalculator
                  productType={merged.product_type}
                  quantity={merged.quantity}
                  onChange={(p) => {
                    setDraft((d) => ({ ...d, ...p }));
                    persist(p);
                  }}
                />
                <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                  <div className="card p-3">
                    <div className="text-[11px] uppercase text-neutral-400">Valor salvo</div>
                    <div className="font-semibold">{formatBRL(merged.value ?? null)}</div>
                  </div>
                  <div className="card p-3">
                    <div className="text-[11px] uppercase text-neutral-400">Entrada (50%)</div>
                    <div className="font-semibold">{formatBRL(merged.entry_value ?? null)}</div>
                  </div>
                </div>
              </section>

              {merged.stage === 4 && (
                <section>
                  <h3 className="field-label">Checklist de fechamento</h3>
                  <Checklist
                    value={merged.checklist ?? []}
                    onChange={(next) => persist({ checklist: next }, "Checklist atualizado")}
                  />
                </section>
              )}

              <section>
                <h3 className="field-label">Anotações</h3>
                <textarea
                  value={merged.notes ?? ""}
                  onChange={(e) => set("notes", e.target.value || null)}
                  onBlur={() => merged.notes !== lead?.notes && persist()}
                  rows={3}
                  className="input resize-y"
                  placeholder="Observações internas do lead..."
                />
              </section>

              <section>
                <h3 className="field-label">Histórico</h3>
                <HistoryTimeline entries={entries} />
              </section>
            </div>

            <footer className="border-t border-border p-3 md:p-4 space-y-2 bg-surface">
              <div className="flex gap-2">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      addNote();
                    }
                  }}
                  placeholder="Adicionar interação ou nota..."
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={addNote}
                  disabled={!note.trim()}
                  className="btn-primary px-4"
                >
                  Adicionar
                </button>
              </div>
              <div className="flex items-center justify-between">
                <button type="button" onClick={removeLead} className="btn-danger text-xs">
                  Excluir lead
                </button>
                <span className="text-[11px] text-neutral-500">
                  {saving ? "Salvando..." : "Todas as alterações são salvas automaticamente"}
                </span>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
