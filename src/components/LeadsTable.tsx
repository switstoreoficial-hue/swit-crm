"use client";

import { useMemo, useState } from "react";
import { useLeads } from "@/hooks/useLeads";
import { useAppStore } from "@/store/useAppStore";
import { STAGES, stageById } from "@/lib/stages";
import { formatBRL, shortDate } from "@/lib/format";
import { leadsToCsv, downloadCsv } from "@/lib/csv";
import { StageBadge } from "./StageBadge";
import { SourceBadge } from "./SourceBadge";
import type { Lead, LeadSource } from "@/types";

type SortKey = "name" | "company" | "stage" | "value" | "quantity" | "created_at" | "updated_at" | "assigned_to";
type SortDir = "asc" | "desc";

export function LeadsTable() {
  const { leads, loading } = useLeads();
  const setActiveLeadId = useAppStore((s) => s.setActiveLeadId);

  const [q, setQ] = useState("");
  const [stage, setStage] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  const [assignee, setAssignee] = useState<string>("all");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const assignees = useMemo(() => {
    const s = new Set<string>();
    leads.forEach((l) => l.assigned_to && s.add(l.assigned_to));
    return Array.from(s).sort();
  }, [leads]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return leads
      .filter((l) => {
        if (stage !== "all" && l.stage !== Number(stage)) return false;
        if (source !== "all" && l.source !== (source as LeadSource)) return false;
        if (assignee !== "all" && (l.assigned_to ?? "") !== assignee) return false;
        if (!term) return true;
        return [l.name, l.company ?? "", l.whatsapp].some((v) => v.toLowerCase().includes(term));
      })
      .sort((a, b) => {
        const av = (a[sortKey] ?? "") as string | number;
        const bv = (b[sortKey] ?? "") as string | number;
        if (av === bv) return 0;
        const cmp = av > bv ? 1 : -1;
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [leads, q, stage, source, assignee, sortKey, sortDir]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  }

  function toggleAll(check: boolean) {
    if (!check) return setSelected({});
    const next: Record<string, boolean> = {};
    filtered.forEach((l) => (next[l.id] = true));
    setSelected(next);
  }

  const selectedCount = Object.values(selected).filter(Boolean).length;

  function exportSelected() {
    const subset = filtered.filter((l) => selected[l.id]);
    if (subset.length === 0) return;
    downloadCsv(`leads-selecionados-${Date.now()}.csv`, leadsToCsv(subset));
  }

  function exportAll() {
    downloadCsv(`leads-${Date.now()}.csv`, leadsToCsv(filtered));
  }

  return (
    <div className="px-4 md:px-6 py-4 max-w-7xl mx-auto">
      <div className="mb-4 flex items-baseline justify-between gap-3 flex-wrap">
        <h1 className="heading text-xl md:text-2xl">Leads</h1>
        <span className="text-xs text-neutral-400">
          {loading ? "..." : `${filtered.length} de ${leads.length}`}
        </span>
      </div>

      <div className="grid gap-2 mb-3 md:grid-cols-[1fr_repeat(3,min-content)_auto]">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input"
          placeholder="Buscar por nome, empresa ou WhatsApp..."
        />
        <select value={stage} onChange={(e) => setStage(e.target.value)} className="input md:w-44">
          <option value="all">Todos os stages</option>
          {STAGES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)} className="input md:w-40">
          <option value="all">Todas as origens</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
        </select>
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="input md:w-40">
          <option value="all">Todos responsáveis</option>
          {assignees.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={exportSelected}
            disabled={selectedCount === 0}
            className="btn-ghost text-xs whitespace-nowrap"
          >
            Exportar {selectedCount > 0 ? `(${selectedCount})` : "selecionados"}
          </button>
          <button onClick={exportAll} className="btn-primary text-xs whitespace-nowrap">
            Exportar tudo
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-surface-2 text-xs uppercase tracking-wide text-neutral-400">
            <tr>
              <th className="px-3 py-2 w-8">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedCount === filtered.length}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="h-4 w-4 accent-[#f5c842]"
                  aria-label="Selecionar todos"
                />
              </th>
              <Th label="Nome" k="name" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <Th label="Empresa" k="company" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <th className="px-3 py-2 text-left">WhatsApp</th>
              <th className="px-3 py-2 text-left">Origem</th>
              <Th label="Stage" k="stage" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <Th label="Qtd" k="quantity" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
              <Th label="Valor" k="value" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
              <Th label="Resp." k="assigned_to" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <Th label="Atualizado" k="updated_at" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <Row
                key={l.id}
                lead={l}
                checked={!!selected[l.id]}
                onCheck={(v) => setSelected((s) => ({ ...s, [l.id]: v }))}
                onOpen={() => setActiveLeadId(l.id)}
              />
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-8 text-neutral-500">
                  Nenhum lead corresponde aos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  label,
  k,
  sortKey,
  sortDir,
  onClick,
  align = "left"
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onClick: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sortKey === k;
  return (
    <th className={`px-3 py-2 text-${align}`}>
      <button
        onClick={() => onClick(k)}
        className={`inline-flex items-center gap-1 hover:text-neutral-100 ${active ? "text-accent" : ""}`}
      >
        {label}
        {active && <span>{sortDir === "asc" ? "▲" : "▼"}</span>}
      </button>
    </th>
  );
}

function Row({
  lead,
  checked,
  onCheck,
  onOpen
}: {
  lead: Lead;
  checked: boolean;
  onCheck: (v: boolean) => void;
  onOpen: () => void;
}) {
  return (
    <tr className="border-t border-border hover:bg-surface-2/60 cursor-pointer" onClick={onOpen}>
      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheck(e.target.checked)}
          className="h-4 w-4 accent-[#f5c842]"
          aria-label={`Selecionar ${lead.name}`}
        />
      </td>
      <td className="px-3 py-2 font-medium">{lead.name}</td>
      <td className="px-3 py-2 text-neutral-300">{lead.company ?? "—"}</td>
      <td className="px-3 py-2 text-neutral-300">{lead.whatsapp}</td>
      <td className="px-3 py-2"><SourceBadge source={lead.source} /></td>
      <td className="px-3 py-2"><StageBadge stage={lead.stage} /></td>
      <td className="px-3 py-2 text-right text-neutral-300">{lead.quantity ?? "—"}</td>
      <td className="px-3 py-2 text-right">{formatBRL(lead.value)}</td>
      <td className="px-3 py-2 text-neutral-300">{lead.assigned_to ?? "—"}</td>
      <td className="px-3 py-2 text-neutral-400 text-xs whitespace-nowrap">
        {shortDate(lead.updated_at)}
      </td>
    </tr>
  );
}
