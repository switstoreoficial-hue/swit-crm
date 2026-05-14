"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase";
import { maskWhatsApp } from "@/lib/format";
import type { LeadSource } from "@/types";

const SOURCES: { id: LeadSource; label: string; emoji: string }[] = [
  { id: "whatsapp",  label: "WhatsApp",  emoji: "💬" },
  { id: "facebook",  label: "Facebook",  emoji: "📘" },
  { id: "instagram", label: "Instagram", emoji: "📸" }
];

export function QuickAddSheet() {
  const open = useAppStore((s) => s.quickAddOpen);
  const setOpen = useAppStore((s) => s.setQuickAddOpen);
  const user = useAppStore((s) => s.user);
  const pushToast = useAppStore((s) => s.pushToast);
  const setActiveLeadId = useAppStore((s) => s.setActiveLeadId);

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [company, setCompany] = useState("");
  const [source, setSource] = useState<LeadSource>("whatsapp");
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setWhatsapp("");
      setCompany("");
      setSource("whatsapp");
      const t = setTimeout(() => nameRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!name.trim() || !whatsapp.trim()) {
      pushToast({ message: "Nome e WhatsApp são obrigatórios", variant: "error" });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase()
      .from("leads")
      .insert({
        name: name.trim(),
        whatsapp: whatsapp.trim(),
        company: company.trim() || null,
        source,
        stage: 0,
        assigned_to: user ?? "Admin"
      })
      .select()
      .single();
    setSaving(false);

    if (error || !data) {
      pushToast({ message: `Erro ao criar lead: ${error?.message ?? "desconhecido"}`, variant: "error" });
      return;
    }

    await supabase().from("lead_history").insert({
      lead_id: data.id,
      user_name: user ?? "Sistema",
      text: `Lead criado via Quick-Add (origem: ${source}).`
    });

    setOpen(false);
    pushToast({
      message: `Lead "${data.name}" criado!`,
      variant: "success",
      action: {
        label: "Abrir detalhes",
        onClick: () => setActiveLeadId(data.id)
      }
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex md:items-center md:justify-center" aria-modal>
      <button
        aria-label="Fechar"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/60 animate-fadeIn"
      />
      <form
        onSubmit={save}
        className="relative w-full md:max-w-md card md:rounded-2xl rounded-t-2xl border-x-0 md:border-x border-t md:border-t mt-auto md:mt-0 p-5 safe-bottom animate-slideUp md:animate-fadeIn"
      >
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-border md:hidden" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="heading text-lg">Novo Lead</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-neutral-400 hover:text-neutral-100"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="field-label">Nome *</label>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="João Silva"
              autoComplete="off"
              required
            />
          </div>

          <div>
            <label className="field-label">WhatsApp *</label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(maskWhatsApp(e.target.value))}
              className="input"
              placeholder="(11) 99999-9999"
              inputMode="numeric"
              required
            />
          </div>

          <div>
            <label className="field-label">Empresa</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="input"
              placeholder="Empresa Ltda."
              autoComplete="off"
            />
          </div>

          <div>
            <label className="field-label">Origem</label>
            <div className="grid grid-cols-3 gap-2">
              {SOURCES.map((s) => {
                const active = source === s.id;
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setSource(s.id)}
                    className={`rounded-lg border-2 px-3 py-3 text-sm font-medium transition-colors ${
                      active
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-surface-2 text-neutral-300 hover:border-neutral-600"
                    }`}
                  >
                    <div className="text-lg">{s.emoji}</div>
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary mt-5 w-full text-base py-3"
        >
          {saving ? "Salvando..." : "Salvar Lead"}
        </button>
      </form>
    </div>
  );
}
