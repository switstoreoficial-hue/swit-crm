"use client";

import { useMemo } from "react";
import { PRODUCT_TYPES, quote, tiersFor } from "@/lib/pricing";
import { formatBRL } from "@/lib/format";

export function ProductCalculator({
  productType,
  quantity,
  onChange
}: {
  productType: string | null;
  quantity: number | null;
  onChange: (data: {
    product_type: string | null;
    quantity: number | null;
    value: number | null;
    entry_value: number | null;
  }) => void;
}) {
  const q = useMemo(
    () => (productType && quantity ? quote(productType, quantity) : null),
    [productType, quantity]
  );
  const tiers = useMemo(() => (productType ? tiersFor(productType) : []), [productType]);

  function pickType(t: string) {
    const newQuote = quantity ? quote(t, quantity) : null;
    onChange({
      product_type: t,
      quantity,
      value: newQuote?.value ?? null,
      entry_value: newQuote?.entry ?? null
    });
  }

  function pickQty(qty: number | null) {
    const newQuote = productType && qty ? quote(productType, qty) : null;
    onChange({
      product_type: productType,
      quantity: qty,
      value: newQuote?.value ?? null,
      entry_value: newQuote?.entry ?? null
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="field-label">Produto</label>
        <div className="grid grid-cols-2 gap-2">
          {PRODUCT_TYPES.map((t) => {
            const active = productType === t;
            return (
              <button
                type="button"
                key={t}
                onClick={() => pickType(t)}
                className={`rounded-lg border-2 px-3 py-2 text-xs font-medium text-left transition-colors ${
                  active
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-surface-2 text-neutral-300 hover:border-neutral-600"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="field-label">Quantidade</label>
        <input
          type="number"
          min={1}
          value={quantity ?? ""}
          onChange={(e) => {
            const v = e.target.value === "" ? null : Math.max(0, Math.floor(+e.target.value));
            pickQty(v);
          }}
          className="input"
          placeholder="Ex: 25"
          inputMode="numeric"
        />
      </div>

      {q && (
        <div className="card border-accent/40 bg-accent/5 p-4">
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-400">Total estimado</div>
              <div className="text-2xl heading text-accent">{formatBRL(q.value)}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase text-neutral-400">Unitário</div>
              <div className="text-sm font-medium">{formatBRL(q.unit)}</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-300">
              Entrada (50%): <strong className="text-neutral-100">{formatBRL(q.entry)}</strong>
            </span>
            <span className="pill bg-surface-2 border border-border text-neutral-300">
              {q.tier} • {q.benefit}
            </span>
          </div>
        </div>
      )}

      {productType && tiers.length > 0 && (
        <details className="card border-border p-3">
          <summary className="cursor-pointer text-xs font-semibold text-neutral-400 uppercase tracking-wide">
            Tabela de preços ({productType})
          </summary>
          <table className="mt-3 w-full text-xs">
            <thead className="text-neutral-500">
              <tr>
                <th className="text-left py-1">Qtd</th>
                <th className="text-right py-1">Unitário</th>
                <th className="text-right py-1">Benefício</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t) => {
                const active = quantity != null && quantity >= t.min && quantity <= t.max;
                return (
                  <tr
                    key={t.label}
                    className={`border-t border-border ${active ? "text-accent font-semibold" : "text-neutral-300"}`}
                  >
                    <td className="py-1.5">{t.label}</td>
                    <td className="py-1.5 text-right">{formatBRL(t.unit)}</td>
                    <td className="py-1.5 text-right">{t.benefit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}
