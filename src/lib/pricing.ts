export type ProductLine = "Premium" | "Confort";
export type SleeveStyle = "Manga Curta" | "Manga Longa" | "Regata";
export type ProductType = `${ProductLine} ${SleeveStyle}`;

export const PRODUCT_TYPES: ProductType[] = [
  "Premium Manga Curta",
  "Premium Manga Longa",
  "Premium Regata",
  "Confort Manga Curta",
  "Confort Manga Longa",
  "Confort Regata"
];

interface Tier {
  min: number;
  max: number;
  label: string;
  premium: number;
  confort: number | null;
  benefit: { premium: string; confort: string };
}

const TIERS: Tier[] = [
  {
    min: 5, max: 9, label: "5–9",
    premium: 64.9, confort: 79.9,
    benefit: { premium: "—", confort: "+1 brinde" }
  },
  {
    min: 10, max: 19, label: "10–19",
    premium: 59.9, confort: 74.9,
    benefit: { premium: "+1 brinde", confort: "+2 brindes" }
  },
  {
    min: 20, max: 34, label: "20–34",
    premium: 54.9, confort: 69.9,
    benefit: { premium: "+2 brindes", confort: "Frete + 2 brindes" }
  },
  {
    min: 35, max: 49, label: "35–49",
    premium: 51.9, confort: 64.9,
    benefit: { premium: "Frete + 2 brindes", confort: "Frete + 5 brindes" }
  },
  {
    min: 50, max: 99, label: "50–99",
    premium: 48.9, confort: 59.9,
    benefit: { premium: "Frete + 3 brindes", confort: "Frete + 3 brindes (5 dias úteis)" }
  },
  {
    min: 100, max: Infinity, label: "100+",
    premium: 44.9, confort: null,
    benefit: { premium: "Frete + 5 brindes", confort: "—" }
  }
];

const SLEEVE_DELTA: Record<SleeveStyle, number> = {
  "Manga Curta": 0,
  "Manga Longa": 5,
  Regata: -5
};

function parseProduct(productType: string): { line: ProductLine; sleeve: SleeveStyle } | null {
  const idx = productType.indexOf(" ");
  if (idx === -1) return null;
  const line = productType.slice(0, idx) as ProductLine;
  const sleeve = productType.slice(idx + 1) as SleeveStyle;
  if ((line !== "Premium" && line !== "Confort") || !(sleeve in SLEEVE_DELTA)) {
    return null;
  }
  return { line, sleeve };
}

export function findTier(quantity: number): Tier | null {
  if (!Number.isFinite(quantity) || quantity < 5) return null;
  return TIERS.find((t) => quantity >= t.min && quantity <= t.max) ?? null;
}

export function tiersFor(productType: string) {
  const parsed = parseProduct(productType);
  if (!parsed) return [];
  const delta = SLEEVE_DELTA[parsed.sleeve];
  return TIERS.map((t) => {
    const base = parsed.line === "Premium" ? t.premium : t.confort;
    if (base === null) return null;
    return {
      label: t.label,
      min: t.min,
      max: t.max,
      unit: +(base + delta).toFixed(2),
      benefit: parsed.line === "Premium" ? t.benefit.premium : t.benefit.confort
    };
  }).filter(Boolean) as {
    label: string; min: number; max: number; unit: number; benefit: string;
  }[];
}

export interface Quote {
  unit: number;
  value: number;
  entry: number;
  tier: string;
  benefit: string;
}

export function quote(productType: string, quantity: number): Quote | null {
  const parsed = parseProduct(productType);
  if (!parsed) return null;
  const tier = findTier(quantity);
  if (!tier) return null;
  const base = parsed.line === "Premium" ? tier.premium : tier.confort;
  if (base === null) return null;
  const unit = +(base + SLEEVE_DELTA[parsed.sleeve]).toFixed(2);
  const value = +(unit * quantity).toFixed(2);
  return {
    unit,
    value,
    entry: +(value * 0.5).toFixed(2),
    tier: tier.label,
    benefit: parsed.line === "Premium" ? tier.benefit.premium : tier.benefit.confort
  };
}
