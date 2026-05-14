import { formatDistanceToNowStrict, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatBRL(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2
  });
}

export function maskWhatsApp(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  const len = digits.length;
  if (len <= 2) return digits.length ? `(${digits}` : "";
  if (len <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (len <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function toWaLink(whatsapp: string): string {
  const digits = whatsapp.replace(/\D/g, "");
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}`;
}

export function relativeFromNow(iso: string): string {
  try {
    return formatDistanceToNowStrict(parseISO(iso), { locale: ptBR, addSuffix: false });
  } catch {
    return "";
  }
}

export function daysSince(iso: string): number {
  try {
    return Math.max(0, differenceInDays(new Date(), parseISO(iso)));
  } catch {
    return 0;
  }
}

export function shortDate(iso: string): string {
  try {
    return parseISO(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}
