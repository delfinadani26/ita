/*
 * ❌ SUPABASE REALTIME: DESATIVADO - Migrado para Firebase
 * 
 * Este arquivo foi mantido como referência histórica
 * Para usar Firebase Realtime, veja:
 * - server/storage-firebase.ts (Usa Firestore Listeners em vez de Supabase Realtime)
 * 
import React, { useEffect } from "react";
import { supabase } from "./supabase";

interface RealtimeConfig {
  table: string;
  event?: "*" | "INSERT" | "UPDATE" | "DELETE";
  schema?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onPayload?: (payload: any) => void;
}

export function useRealtimeSubscription(config: RealtimeConfig) {
  const {
    table,
    event = "*",
    schema = "public",
    onInsert,
    onUpdate,
    onDelete,
    onPayload,
  } = config;

  useEffect(() => {
    const channelName = `${schema}:${table}`;

    const subscription = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event, schema, table },
        (payload: any) => {
          console.log(`[${table}] Payload:`, payload);

          if (onPayload && typeof onPayload === "function") {
            onPayload(payload);
          }

          if (payload?.eventType) {
            const eventType = String(payload.eventType).toUpperCase();
            
            switch (eventType) {
              case "INSERT":
                if (onInsert && typeof onInsert === "function") {
                  onInsert(payload.new || payload);
                }
                break;
              case "UPDATE":
                if (onUpdate && typeof onUpdate === "function") {
                  onUpdate(payload.new || payload);
                }
                break;
              case "DELETE":
                if (onDelete && typeof onDelete === "function") {
                  onDelete(payload.old || payload);
                }
                break;
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`[${table}] Realtime status:`, status);
      });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [table, event, schema, onInsert, onUpdate, onDelete, onPayload]);
}

export function useRealtime(configs: RealtimeConfig[]) {
 */

// ✅ FIREBASE: ATIVO
// Para usar Firestore Listeners (equivalente ao Supabase Realtime):
// Veja: server/storage-firebase.ts

export interface RealtimeConfig {
  table: string;
  event?: "*" | "INSERT" | "UPDATE" | "DELETE";
  schema?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onPayload?: (payload: any) => void;
}

export function useRealtimeSubscription(config: RealtimeConfig) {
  // Stub para Firebase - implementar quando necessário
  return null;
}

export function useRealtime(configs: RealtimeConfig[]) {
  if (!Array.isArray(configs)) {
    console.error("useRealtime: configs must be an array");
    return;
  }

  configs.forEach((config) => {
    if (config && typeof config === "object" && config.table) {
      useRealtimeSubscription(config);
    }
  });
}

export default useRealtimeSubscription;
