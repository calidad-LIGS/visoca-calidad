import { supabase } from "@/integrations/supabase/client";

export const EVENT_COLORS = {
  proyecto: "#3B7DD8",
  pnc: "#F5A623",
  auditoria: "#8B5CF6",
  manual: "#555A6B",
} as const;

type Tipo = keyof typeof EVENT_COLORS;

interface SyncArgs {
  tipo: Tipo;
  titulo: string;
  descripcion?: string | null;
  fecha_inicio: string; // ISO date or datetime
  fecha_fin?: string | null;
  referencia_id: string;
  referencia_tabla: string;
  empresa_id?: string | null;
  area_id?: string | null;
  all_day?: boolean;
}

/** Crea o actualiza el evento de calendario asociado a un registro. */
export async function upsertEvento(args: SyncArgs) {
  const payload = {
    tipo: args.tipo,
    titulo: args.titulo,
    descripcion: args.descripcion ?? null,
    fecha_inicio: args.fecha_inicio,
    fecha_fin: args.fecha_fin ?? null,
    referencia_id: args.referencia_id,
    referencia_tabla: args.referencia_tabla,
    empresa_id: args.empresa_id ?? null,
    area_id: args.area_id ?? null,
    color: EVENT_COLORS[args.tipo],
    all_day: args.all_day ?? true,
  };
  const { data: existing } = await supabase
    .from("eventos_calendario")
    .select("id")
    .eq("referencia_id", args.referencia_id)
    .eq("referencia_tabla", args.referencia_tabla)
    .maybeSingle();

  if (existing) {
    await supabase.from("eventos_calendario").update(payload).eq("id", existing.id);
  } else {
    await supabase.from("eventos_calendario").insert(payload);
  }
}

export async function deleteEvento(referencia_id: string, referencia_tabla: string) {
  await supabase
    .from("eventos_calendario")
    .delete()
    .eq("referencia_id", referencia_id)
    .eq("referencia_tabla", referencia_tabla);
}
