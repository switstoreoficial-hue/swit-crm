"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { LeadHistory } from "@/types";

export function useLeadHistory(leadId: string | null) {
  const [entries, setEntries] = useState<LeadHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!leadId) {
      setEntries([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase()
      .from("lead_history")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    setEntries((data ?? []) as LeadHistory[]);
    setLoading(false);
  }, [leadId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!leadId) return;
    const channel = supabase()
      .channel(`history-${leadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "lead_history", filter: `lead_id=eq.${leadId}` },
        (payload) => {
          const row = payload.new as LeadHistory;
          setEntries((prev) => (prev.some((e) => e.id === row.id) ? prev : [row, ...prev]));
        }
      )
      .subscribe();
    return () => {
      supabase().removeChannel(channel);
    };
  }, [leadId]);

  return { entries, loading, refresh };
}
