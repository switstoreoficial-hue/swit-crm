"use client";

import { CHECKLIST_ITEMS } from "@/lib/stages";

export function Checklist({
  value,
  onChange,
  disabled
}: {
  value: boolean[];
  onChange: (next: boolean[]) => void;
  disabled?: boolean;
}) {
  const safe = Array.from({ length: CHECKLIST_ITEMS.length }, (_, i) => !!value?.[i]);
  return (
    <ul className="space-y-2">
      {CHECKLIST_ITEMS.map((label, i) => {
        const checked = safe[i];
        return (
          <li key={i}>
            <label
              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                checked ? "border-stage-4/50 bg-stage-4/10" : "border-border bg-surface-2 hover:border-neutral-600"
              }`}
            >
              <input
                type="checkbox"
                disabled={disabled}
                checked={checked}
                onChange={(e) => {
                  const next = [...safe];
                  next[i] = e.target.checked;
                  onChange(next);
                }}
                className="mt-0.5 h-4 w-4 accent-[#22c55e]"
              />
              <span className={`text-sm ${checked ? "text-stage-4" : "text-neutral-200"}`}>
                {label}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
