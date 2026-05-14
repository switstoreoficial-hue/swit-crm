import type { Lead } from "@/types";
import { stageById } from "./stages";

const HEADERS = [
  "id",
  "name",
  "whatsapp",
  "company",
  "source",
  "stage",
  "stage_label",
  "product_type",
  "quantity",
  "value",
  "entry_value",
  "tiny_order",
  "assigned_to",
  "notes",
  "logo_received",
  "mockup_sent",
  "created_at",
  "updated_at"
];

function escape(v: unknown): string {
  if (v == null) return "";
  const s = String(v).replace(/\r?\n/g, " ").trim();
  if (s.includes(",") || s.includes('"') || s.includes(";")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function leadsToCsv(leads: Lead[]): string {
  const rows = leads.map((l) =>
    [
      l.id,
      l.name,
      l.whatsapp,
      l.company,
      l.source,
      l.stage,
      stageById(l.stage).label,
      l.product_type,
      l.quantity,
      l.value,
      l.entry_value,
      l.tiny_order,
      l.assigned_to,
      l.notes,
      l.logo_received,
      l.mockup_sent,
      l.created_at,
      l.updated_at
    ]
      .map(escape)
      .join(",")
  );
  return [HEADERS.join(","), ...rows].join("\r\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
