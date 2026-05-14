import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("forbidden", { status: 403 });
}

interface ExtractedLead {
  name: string;
  whatsapp: string;
  company: string | null;
  source: "facebook" | "instagram";
}

function pickFieldValue(fields: { name?: string; values?: string[] }[], names: string[]): string | null {
  for (const f of fields) {
    if (!f?.name) continue;
    if (names.some((n) => f.name!.toLowerCase().includes(n))) {
      const v = f.values?.[0];
      if (v) return v;
    }
  }
  return null;
}

function extractFromPayload(payload: any): ExtractedLead[] {
  const out: ExtractedLead[] = [];

  // Simple direct payload (testing / generic forms)
  if (payload && typeof payload === "object" && (payload.name || payload.full_name)) {
    const src = (payload.source ?? payload.platform ?? "facebook").toString().toLowerCase();
    out.push({
      name: String(payload.name ?? payload.full_name ?? "Sem nome"),
      whatsapp: String(payload.phone ?? payload.whatsapp ?? payload.phone_number ?? ""),
      company: payload.company ? String(payload.company) : null,
      source: src.includes("insta") ? "instagram" : "facebook"
    });
    return out;
  }

  // Standard Meta webhook envelope
  const entries: any[] = Array.isArray(payload?.entry) ? payload.entry : [];
  for (const entry of entries) {
    const changes: any[] = Array.isArray(entry.changes) ? entry.changes : [];
    for (const change of changes) {
      const value = change.value ?? {};
      const fields: any[] = Array.isArray(value.field_data) ? value.field_data : [];
      const platform = (value.platform ?? entry?.platform ?? "facebook").toString().toLowerCase();
      const source: "facebook" | "instagram" = platform.includes("insta") ? "instagram" : "facebook";

      if (fields.length > 0) {
        const name = pickFieldValue(fields, ["name", "nome", "full_name"]) ?? "Sem nome";
        const phone = pickFieldValue(fields, ["phone", "whatsapp", "telefone", "celular"]) ?? "";
        const company = pickFieldValue(fields, ["company", "empresa"]);
        out.push({ name, whatsapp: phone, company, source });
      } else if (value.leadgen_id) {
        // No access token configured to fetch from Graph — log a placeholder
        out.push({
          name: `Lead Meta #${value.leadgen_id}`,
          whatsapp: "",
          company: null,
          source
        });
      }
    }
  }
  return out;
}

export async function POST(req: NextRequest) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const leads = extractFromPayload(payload);
  if (leads.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0, note: "no leads parsed" });
  }

  const supabase = supabaseServer();
  const rows = leads.map((l) => ({
    name: l.name || "Sem nome",
    whatsapp: l.whatsapp || "",
    company: l.company,
    source: l.source,
    stage: 0,
    assigned_to: "Admin"
  }));

  const { data, error } = await supabase.from("leads").insert(rows).select("id, name");
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (data && data.length > 0) {
    await supabase.from("lead_history").insert(
      data.map((d) => ({
        lead_id: d.id,
        user_name: "Meta Webhook",
        text: `Lead capturado via formulário (origem: ${leads[0].source}).`
      }))
    );
  }

  return NextResponse.json({ ok: true, inserted: data?.length ?? 0 });
}
