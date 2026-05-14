"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/useAppStore";
import type { Lead } from "@/types";

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = useAppStore((s) => s.user);
  const pushToast = useAppStore((s) => s.pushToast);
  const initialLoaded = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const { data, error } = await supabase()
        .from("leads")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setLeads((data ?? []) as Lead[]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar leads");
    } finally {
      setLoading(false);
      initialLoaded.current = true;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const channel = supabase()
      .channel("leads-stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as Lead;
            setLeads((prev) => (prev.some((l) => l.id === row.id) ? prev : [row, ...prev]));
            if (initialLoaded.current && row.assigned_to && row.assigned_to !== currentUser) {
              pushToast({ message: `${row.assigned_to ?? "Alguém"} criou ${row.name}` });
            }
          } else if (payload.eventType === "UPDATE") {
            const row = payload.new as Lead;
            setLeads((prev) => prev.map((l) => (l.id === row.id ? row : l)));
            if (initialLoaded.current && row.assigned_to && row.assigned_to !== currentUser) {
              pushToast({ message: `${row.assigned_to} atualizou ${row.name}` });
            }
          } else if (payload.eventType === "DELETE") {
            const row = payload.old as Lead;
            setLeads((prev) => prev.filter((l) => l.id !== row.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase().removeChannel(channel);
    };
  }, [currentUser, pushToast]);

  return { leads, loading, error, refresh, setLeads };
}
