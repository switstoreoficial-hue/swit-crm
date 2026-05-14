"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { LeadCard } from "./LeadCard";
import { STAGES, stageById } from "@/lib/stages";
import { useAppStore } from "@/store/useAppStore";
import { useLeads } from "@/hooks/useLeads";
import { supabase } from "@/lib/supabase";
import type { Lead } from "@/types";

export function Pipeline() {
  const { leads, loading, error } = useLeads();
  const setActiveLeadId = useAppStore((s) => s.setActiveLeadId);
  const pushToast = useAppStore((s) => s.pushToast);
  const user = useAppStore((s) => s.user);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const grouped = useMemo(() => {
    const map = new Map<number, Lead[]>();
    STAGES.forEach((s) => map.set(s.id, []));
    leads.forEach((l) => map.get(l.stage)?.push(l));
    return map;
  }, [leads]);

  const activeLead = useMemo(
    () => (activeId ? leads.find((l) => l.id === activeId) ?? null : null),
    [activeId, leads]
  );

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    if (!e.over) return;
    const leadId = String(e.active.id);
    const newStage = Number(String(e.over.id).replace("stage-", "")) as Lead["stage"];
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage === newStage) return;

    const fromLabel = stageById(lead.stage).label;
    const toLabel = stageById(newStage).label;

    const { error } = await supabase()
      .from("leads")
      .update({ stage: newStage })
      .eq("id", leadId);
    if (error) {
      pushToast({ message: `Erro ao mover lead: ${error.message}`, variant: "error" });
      return;
    }
    await supabase().from("lead_history").insert({
      lead_id: leadId,
      user_name: user ?? "Sistema",
      text: `Stage alterado: ${fromLabel} → ${toLabel}`
    });
  }

  return (
    <div className="px-2 md:px-6 py-4">
      <div className="px-2 md:px-0 mb-3 flex items-baseline justify-between">
        <h1 className="heading text-xl md:text-2xl">Pipeline</h1>
        <span className="text-xs text-neutral-400">
          {loading ? "Carregando..." : `${leads.length} leads`}
        </span>
      </div>

      {error && (
        <div className="mx-2 mb-3 rounded-lg border border-stage-5/50 bg-stage-5/10 p-3 text-sm text-stage-5">
          {error}
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-2 snap-x snap-mandatory md:snap-none">
          {STAGES.map((s) => (
            <Column
              key={s.id}
              stage={s}
              leads={grouped.get(s.id) ?? []}
              onCardClick={(id) => setActiveLeadId(id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead && (
            <div className="opacity-90 w-72">
              <LeadCard lead={activeLead} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({
  stage,
  leads,
  onCardClick
}: {
  stage: (typeof STAGES)[number];
  leads: Lead[];
  onCardClick: (id: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `stage-${stage.id}` });
  return (
    <div className="shrink-0 w-72 md:w-80 snap-center">
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: stage.hex }} />
          <span className="text-xs uppercase tracking-wide font-semibold text-neutral-300">
            {stage.label}
          </span>
        </div>
        <span className="text-[11px] text-neutral-500">{leads.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[60vh] rounded-xl border p-2 space-y-2 transition-colors ${
          isOver ? "border-accent bg-accent/5" : "border-border bg-surface/40"
        }`}
      >
        {leads.length === 0 ? (
          <div className="grid place-items-center text-xs text-neutral-600 py-10">vazio</div>
        ) : (
          leads.map((l) => (
            <DraggableCard key={l.id} lead={l} onClick={() => onCardClick(l.id)} />
          ))
        )}
      </div>
    </div>
  );
}

function DraggableCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className="touch-manipulation"
    >
      <div className="relative">
        <LeadCard lead={lead} onClick={onClick} />
        <button
          {...attributes}
          {...listeners}
          aria-label="Arrastar"
          className="hidden md:grid absolute top-2 right-2 h-6 w-6 place-items-center rounded text-neutral-500 hover:text-neutral-200 hover:bg-surface-2 cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
            <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
