import { supabase } from "@/integrations/supabase/client";
import { nextPncNumero, addBusinessDays, toISODate } from "@/lib/pncUtils";
import { upsertEvento } from "@/lib/calendarSync";

export function codigoAuditoria(tipo: string, anio: number, numero: number) {
  const t = tipo === "interna" ? "INT" : "EXT";
  return `AUD-${anio}-${t}-${String(numero).padStart(2, "0")}`;
}

interface HallazgoInput {
  auditoria_id: string;
  tipo: "nc_mayor" | "nc_menor" | "oportunidad_mejora";
  descripcion: string;
  proceso_documento_id: string | null;
  proceso_texto: string | null;
  area_id: string | null;
  responsable_nombre: string | null;
}

interface AuditoriaCtx {
  tipo: string; // interna | externa
  fecha_inicio: string | null;
  empresa_ids: string[];
  creado_por: string | null;
}

/**
 * Crea un hallazgo y, si es NC o OM, genera automáticamente el PNC vinculado.
 * Devuelve { hallazgoId, pncId }.
 */
export async function crearHallazgoConPnc(h: HallazgoInput, aud: AuditoriaCtx) {
  let pncId: string | null = null;

  const fechaOrigen = aud.fecha_inicio ?? toISODate(new Date());
  const anio = new Date(fechaOrigen).getFullYear();

  const fechaCompromiso =
    h.tipo === "nc_mayor"
      ? toISODate(addBusinessDays(new Date(fechaOrigen), 7))
      : null; // NC menor / OM → antes de siguiente auditoría (libre)

  const numero = await nextPncNumero(anio);
  const { data: pncData, error: pncErr } = await supabase
    .from("pnc")
    .insert({
      numero_anio: numero,
      descripcion: h.descripcion,
      estatus: "pendiente",
      origen: aud.tipo === "interna" ? "auditoria_interna" : "auditoria_externa",
      empresa_id: aud.empresa_ids[0] ?? null,
      area_id: h.area_id,
      proceso_documento_id: h.proceso_documento_id,
      proceso_texto: h.proceso_texto,
      razon: h.tipo,
      metodologia: "na",
      fecha_origen: fechaOrigen,
      fecha_compromiso: fechaCompromiso,
      auditoria_id: h.auditoria_id,
      creado_por: aud.creado_por,
    })
    .select("id")
    .single();
  if (pncErr) throw pncErr;
  pncId = pncData.id;
  await supabase.from("pnc_historial_estatus").insert({
    pnc_id: pncId, estatus_anterior: null, estatus_nuevo: "pendiente",
    comentario: "Generado automáticamente desde hallazgo de auditoría", cambiado_por: aud.creado_por,
  });
  if (fechaCompromiso) {
    await upsertEvento({
      tipo: "pnc", titulo: `${numero}: ${h.descripcion.slice(0, 40)}`,
      descripcion: h.descripcion, fecha_inicio: fechaCompromiso,
      referencia_id: pncId, referencia_tabla: "pnc",
      empresa_id: aud.empresa_ids[0] ?? null, area_id: h.area_id,
    });
  }

  const { data: hData, error: hErr } = await supabase
    .from("auditoria_hallazgos")
    .insert({
      auditoria_id: h.auditoria_id,
      tipo: h.tipo,
      descripcion: h.descripcion,
      proceso_documento_id: h.proceso_documento_id,
      proceso_texto: h.proceso_texto,
      area_id: h.area_id,
      responsable_nombre: h.responsable_nombre,
      pnc_id: pncId,
      estatus: "abierto",
    })
    .select("id")
    .single();
  if (hErr) throw hErr;

  // Al registrar hallazgos la auditoría pasa a "con_hallazgos"
  await supabase.from("auditorias").update({ estatus: "con_hallazgos" }).eq("id", h.auditoria_id);

  return { hallazgoId: hData.id, pncId };
}
