"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend
} from "recharts";
import { useLeads } from "@/hooks/useLeads";
import { STAGES } from "@/lib/stages";
import { formatBRL } from "@/lib/format";
import type { Lead, LeadSource } from "@/types";

const SOURCE_COLORS: Record<LeadSource, string> = {
  whatsapp: "#22c55e",
  facebook: "#3b82f6",
  instagram: "#ec4899"
};

export function Dashboard() {
  const { leads, loading } = useLeads();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [assignee, setAssignee] = useState("all");

  const assignees = useMemo(() => {
    const s = new Set<string>();
    leads.forEach((l) => l.assigned_to && s.add(l.assigned_to));
    return Array.from(s).sort();
  }, [leads]);

  const filtered = useMemo(() => {
    const fromT = from ? new Date(from + "T00:00:00").getTime() : 0;
    const toT = to ? new Date(to + "T23:59:59").getTime() : Infinity;
    return leads.filter((l) => {
      const t = new Date(l.created_at).getTime();
      if (t < fromT || t > toT) return false;
      if (assignee !== "all" && (l.assigned_to ?? "") !== assignee) return false;
      return true;
    });
  }, [leads, from, to, assignee]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const closed = filtered.filter((l) => l.stage === 4);
    const lost = filtered.filter((l) => l.stage === 5).length;
    const inProgress = filtered.filter((l) => l.stage >= 1 && l.stage <= 3).length;
    const mockupPending = filtered.filter((l) => l.stage === 2).length;
    const revenue = closed.reduce((s, l) => s + (l.value ?? 0), 0);
    const ticket = closed.length > 0 ? revenue / closed.length : 0;
    const conv = total > 0 ? (closed.length / total) * 100 : 0;
    return {
      total,
      inProgress,
      mockupPending,
      closed: closed.length,
      lost,
      revenue,
      ticket,
      conv
    };
  }, [filtered]);

  const byStage = useMemo(
    () =>
      STAGES.map((s) => ({
        name: s.label,
        count: filtered.filter((l) => l.stage === s.id).length,
        fill: s.hex
      })),
    [filtered]
  );

  const bySource = useMemo(() => {
    const data: { name: string; value: number; fill: string }[] = [];
    (Object.keys(SOURCE_COLORS) as LeadSource[]).forEach((src) => {
      const count = filtered.filter((l) => l.source === src).length;
      if (count > 0) {
        data.push({
          name: src.charAt(0).toUpperCase() + src.slice(1),
          value: count,
          fill: SOURCE_COLORS[src]
        });
      }
    });
    return data;
  }, [filtered]);

  const funnel = useMemo(() => {
    const total = filtered.length || 1;
    return STAGES.filter((s) => s.id <= 4).map((s) => {
      const count = filtered.filter((l) => l.stage >= s.id && l.stage !== 5).length;
      return { name: s.label, count, pct: Math.round((count / total) * 100), fill: s.hex };
    });
  }, [filtered]);

  return (
    <div className="px-4 md:px-6 py-4 max-w-7xl mx-auto">
      <div className="mb-4 flex items-baseline justify-between gap-3 flex-wrap">
        <h1 className="heading text-xl md:text-2xl">Dashboard</h1>
        <span className="text-xs text-neutral-400">
          {loading ? "..." : `${filtered.length} leads no período`}
        </span>
      </div>

      <div className="card p-3 mb-4 grid gap-2 md:grid-cols-[auto_1fr_auto_1fr_auto_1fr] items-center">
        <label className="text-xs text-neutral-400">De</label>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
        <label className="text-xs text-neutral-400">Até</label>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" />
        <label className="text-xs text-neutral-400">Responsável</label>
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="input">
          <option value="all">Todos</option>
          {assignees.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <Stat label="Total leads" value={stats.total.toString()} />
        <Stat label="Em andamento" value={stats.inProgress.toString()} />
        <Stat label="Mockup pendente" value={stats.mockupPending.toString()} />
        <Stat label="Fechados" value={stats.closed.toString()} accent />
        <Stat label="Receita total" value={formatBRL(stats.revenue)} accent />
        <Stat label="Ticket médio" value={formatBRL(stats.ticket)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="card p-4">
          <h3 className="heading text-sm mb-3">Leads por stage</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={byStage} margin={{ top: 10, right: 8, bottom: 8, left: -20 }}>
                <CartesianGrid stroke="#222" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={11} tickLine={false} />
                <YAxis stroke="#666" fontSize={11} allowDecimals={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "#ffffff08" }}
                  contentStyle={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {byStage.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="heading text-sm mb-3">Leads por origem</h3>
          <div className="h-64">
            {bySource.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-neutral-500">
                Sem dados no período.
              </div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Tooltip
                    contentStyle={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }}
                  />
                  <Pie
                    data={bySource}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {bySource.map((d, i) => (
                      <Cell key={i} fill={d.fill} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="heading text-sm mb-1">Funil de conversão</h3>
        <p className="text-xs text-neutral-500 mb-3">
          Conversão geral: <strong className="text-accent">{stats.conv.toFixed(1)}%</strong> · Perdidos: {stats.lost}
        </p>
        <div className="space-y-2">
          {funnel.map((f) => (
            <div key={f.name}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-neutral-300">{f.name}</span>
                <span className="text-neutral-400">{f.count} ({f.pct}%)</span>
              </div>
              <div className="h-3 rounded-full bg-surface-2 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${f.pct}%`, background: f.fill }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card p-3">
      <div className="text-[11px] uppercase tracking-wide text-neutral-400">{label}</div>
      <div className={`text-lg md:text-xl heading mt-1 ${accent ? "text-accent" : ""}`}>{value}</div>
    </div>
  );
}
