import { cn } from "@/lib/utils";

type BadgeConfig = { label: string; className: string };

// Estilos inline para colores exactos del design system semáforo.
function chip(bg: string, fg: string) {
  return { backgroundColor: bg, color: fg };
}

export const DOC_ESTATUS: Record<string, BadgeConfig & { style: React.CSSProperties }> = {
  vigente: { label: "Vigente", className: "", style: chip("#1BC8A0", "#0F1117") },
  en_revision: { label: "En revisión", className: "", style: chip("#F5A623", "#0F1117") },
  sustituido: { label: "Sustituido", className: "", style: chip("#8B5CF6", "#FFFFFF") },
  eliminado: { label: "Eliminado", className: "", style: chip("#E54B4B", "#FFFFFF") },
};

export const PNC_ESTATUS: Record<string, BadgeConfig & { style: React.CSSProperties }> = {
  pendiente: { label: "Pendiente", className: "", style: chip("#555A6B", "#E8EAF0") },
  cerrado: { label: "Cerrado", className: "", style: chip("#1BC8A0", "#0F1117") },
};

export const AUD_ESTATUS: Record<string, BadgeConfig & { style: React.CSSProperties }> = {
  programada: { label: "Programada", className: "", style: chip("#242736", "#8B90A0") },
  en_ejecucion: { label: "En ejecución", className: "", style: chip("#3B7DD8", "#FFFFFF") },
  con_hallazgos: { label: "Con hallazgos", className: "", style: chip("#F5A623", "#0F1117") },
  en_seguimiento: { label: "En seguimiento", className: "", style: chip("#8B5CF6", "#FFFFFF") },
  cerrada: { label: "Cerrada", className: "", style: chip("#1BC8A0", "#0F1117") },
};

export const PROY_ESTATUS: Record<string, BadgeConfig & { style: React.CSSProperties }> = {
  pendiente: { label: "Pendiente", className: "", style: chip("#555A6B", "#FFFFFF") },
  en_proceso: { label: "En proceso", className: "", style: chip("#3B7DD8", "#FFFFFF") },
  finalizado: { label: "Finalizado", className: "", style: chip("#1BC8A0", "#0F1117") },
  cancelado: { label: "Cancelado", className: "", style: chip("#E54B4B", "#FFFFFF") },
};

export const DOC_TIPO_LABEL: Record<string, string> = {
  politica: "Política",
  proceso: "Proceso",
  manual: "Manual",
  formato: "Formato",
  acta: "Acta",
};

export const PNC_RAZON_LABEL: Record<string, string> = {
  nc_mayor: "NC Mayor",
  nc_menor: "NC Menor",
  oportunidad_mejora: "Oportunidad de mejora",
  omision_proceso: "Omisión de proceso",
  proceso_obsoleto: "Proceso obsoleto",
};

export const PNC_ORIGEN_LABEL: Record<string, string> = {
  auditoria_interna: "Auditoría interna",
  auditoria_externa: "Auditoría externa",
  queja: "Queja",
  multa: "Multa",
  manual: "Manual",
};

export const PNC_METODOLOGIA_LABEL: Record<string, string> = {
  cinco_porques: "5 Por qué",
  ishikawa: "Ishikawa",
  flujograma: "Flujograma",
  na: "N/A",
};

export const HALLAZGO_TIPO_LABEL: Record<string, string> = {
  nc_mayor: "NC Mayor",
  nc_menor: "NC Menor",
  oportunidad_mejora: "Oportunidad",
};

export const APLICACION_LABEL: Record<string, string> = {
  iso: "ISO 9001:2015",
  iso_9001: "ISO 9001:2015",
  ola_oea: "OLA/OEA",
  interno: "Interno",
  iso_ola: "ISO + OLA/OEA",
};

export const NIVEL_LABEL: Record<number, string> = {
  1: "N1 — Política",
  2: "N2 — Manual",
  3: "N3 — Proceso",
  4: "N4 — Formato",
  5: "N5 — Acta",
};

export function StatusBadge({
  cfg,
}: {
  cfg: (BadgeConfig & { style: React.CSSProperties }) | undefined;
}) {
  if (!cfg) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
      )}
      style={cfg.style}
    >
      {cfg.label}
    </span>
  );
}

export function OutlineBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
      {children}
    </span>
  );
}
