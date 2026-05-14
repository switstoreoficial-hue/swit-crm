import type { Stage } from "@/types";

export const STAGES: { id: Stage; label: string; color: string; hex: string }[] = [
  { id: 0, label: "Novo Lead",     color: "stage-0", hex: "#6b7280" },
  { id: 1, label: "Em Contato",    color: "stage-1", hex: "#3b82f6" },
  { id: 2, label: "Mockup Pendente", color: "stage-2", hex: "#f5c842" },
  { id: 3, label: "Proposta",      color: "stage-3", hex: "#f97316" },
  { id: 4, label: "Fechado / Pago", color: "stage-4", hex: "#22c55e" },
  { id: 5, label: "Perdido",       color: "stage-5", hex: "#ef4444" }
];

export const stageById = (id: number) => STAGES.find((s) => s.id === id) ?? STAGES[0];

export const CHECKLIST_ITEMS = [
  "Pagamento confirmado",
  "Card movido para Fechado / Pago no CRM",
  "Cliente cadastrado no Tiny ERP",
  "Pedido criado no Tiny ERP",
  "NF emitida",
  "Nº pedido Tiny registrado no card",
  "Pedido encaminhado para produção"
];
