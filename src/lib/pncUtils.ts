import { supabase } from "@/integrations/supabase/client";

/** Genera el siguiente número correlativo PNC-AAAA-NNN para el año dado. */
export async function nextPncNumero(anio: number): Promise<string> {
  const { data, error } = await supabase
    .from("pnc")
    .select("numero_anio")
    .like("numero_anio", `PNC-${anio}-%`);
  if (error) throw error;
  let max = 0;
  for (const r of data ?? []) {
    const m = (r.numero_anio as string).match(/-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `PNC-${anio}-${String(max + 1).padStart(3, "0")}`;
}

/** Suma días hábiles (lun-vie) a una fecha. */
export function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d;
}

export function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export interface DiasInfo {
  dias: number;
  color: "accent" | "warning" | "danger";
}

/** Días transcurridos desde origen + color de urgencia respecto al compromiso. */
export function diasInfo(
  fechaOrigen: string,
  fechaCompromiso: string | null,
  finalizado: boolean,
): DiasInfo {
  const hoy = new Date();
  const origen = new Date(fechaOrigen);
  const dias = Math.max(0, Math.floor((hoy.getTime() - origen.getTime()) / 86400000));
  if (!fechaCompromiso) return { dias, color: "accent" };
  const comp = new Date(fechaCompromiso);
  const diff = Math.floor((comp.getTime() - hoy.getTime()) / 86400000);
  if (!finalizado && diff < 0) return { dias, color: "danger" };
  if (!finalizado && diff <= 3) return { dias, color: "warning" };
  return { dias, color: "accent" };
}
