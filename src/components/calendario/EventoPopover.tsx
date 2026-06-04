import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, ExternalLink, CalendarPlus, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { EVENT_COLORS } from "@/lib/calendarSync";
import { buildIcs, downloadIcs } from "@/lib/icsExport";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export interface CalendarEvento {
  id: string;
  tipo: string;
  titulo: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  color: string | null;
  referencia_id: string | null;
  invitados_email: string[] | null;
  all_day: boolean | null;
  creado_por: string | null;
}

const TIPO_LABEL: Record<string, string> = {
  proyecto: "Proyecto", pnc: "No conformidad", auditoria: "Auditoría", manual: "Manual",
};

function fmtShort(iso: string) {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return d.toLocaleDateString("es", { day: "numeric", month: "short" });
}

export function EventoPopover({
  evento, children,
}: { evento: CalendarEvento; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { perfil, isGerente } = useAuth();

  const tipoColor = evento.color ?? EVENT_COLORS[evento.tipo as keyof typeof EVENT_COLORS] ?? "#555A6B";
  const tipoLabel = TIPO_LABEL[evento.tipo] ?? evento.tipo;
  const fechas = evento.fecha_fin && evento.fecha_fin.slice(0, 10) !== evento.fecha_inicio.slice(0, 10)
    ? `${fmtShort(evento.fecha_inicio)} → ${fmtShort(evento.fecha_fin)}`
    : fmtShort(evento.fecha_inicio);

  const canDelete = evento.tipo === "manual" && (isGerente || evento.creado_por === perfil?.id);

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("eventos_calendario").delete().eq("id", evento.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eventos_calendario"] });
      toast.success("Evento eliminado");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const verModulo = () => {
    setOpen(false);
    if (evento.tipo === "pnc") {
      navigate({ to: "/no-conformidades", search: { id: evento.referencia_id ?? undefined } });
    } else if (evento.tipo === "auditoria" && evento.referencia_id) {
      navigate({ to: "/auditorias/$id", params: { id: evento.referencia_id } });
    } else if (evento.tipo === "proyecto") {
      navigate({ to: "/proyectos" });
    }
  };

  const exportThis = () => {
    downloadIcs(`evento_${evento.id}.ics`, buildIcs([evento]));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[280px] p-3"
        style={{ backgroundColor: "#1A1D27", borderColor: "#2E3347" }}
      >
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-foreground">{evento.titulo}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold text-white"
              style={{ backgroundColor: tipoColor }}
            >
              {tipoLabel}
            </span>
            <span className="font-mono text-xs text-muted-foreground">{fechas}</span>
          </div>

          {evento.descripcion && (
            <p className="text-sm text-muted-foreground">{evento.descripcion}</p>
          )}

          {evento.invitados_email && evento.invitados_email.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {evento.invitados_email.length} invitado(s)
            </p>
          )}

          <div className="space-y-1.5 border-t border-border pt-2.5">
            {evento.tipo !== "manual" && (
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={verModulo}>
                <ExternalLink className="mr-2 h-4 w-4" /> Ver en módulo
              </Button>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" className="w-full justify-start" onClick={exportThis}>
                    <CalendarPlus className="mr-2 h-4 w-4" /> Enviar a Google Calendar
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Descarga el evento e impórtalo en Google Calendar para enviar invitaciones
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={exportThis}>
              <Download className="mr-2 h-4 w-4" /> Exportar este evento a .ics
            </Button>

            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-danger hover:text-danger"
                onClick={() => del.mutate()}
                disabled={del.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar evento
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
