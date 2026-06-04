import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, CalendarDays, Download, Plus, CalendarRange, LayoutGrid } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePermisos } from "@/lib/permisos";
import { EVENT_COLORS } from "@/lib/calendarSync";
import { buildIcs, downloadIcs } from "@/lib/icsExport";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { EventoPopover, type CalendarEvento } from "./EventoPopover";
import { Button } from "@/components/ui/button";
import { ManualEventoDialog } from "./ManualEventoDialog";

const TIPO_LABEL: Record<string, string> = {
  proyecto: "Proyectos", pnc: "No conformidades", auditoria: "Auditorías", manual: "Manuales",
};
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CalendarView() {
  const perms = usePermisos();
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [filterTipo, setFilterTipo] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [view, setView] = useState<"mes" | "agenda">("mes");

  const { data: eventos = [] } = useQuery({
    queryKey: ["eventos_calendario"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eventos_calendario")
        .select("id, tipo, titulo, descripcion, fecha_inicio, fecha_fin, color, referencia_id, invitados_email, all_day, creado_por")
        .order("fecha_inicio");
      if (error) throw error;
      return data as CalendarEvento[];
    },
    staleTime: 30_000,
  });

  const visible = filterTipo ? eventos.filter((e) => e.tipo === filterTipo) : eventos;

  const byDay = useMemo(() => {
    const map: Record<string, CalendarEvento[]> = {};
    visible.forEach((e) => {
      const key = e.fecha_inicio.slice(0, 10);
      (map[key] ??= []).push(e);
    });
    return map;
  }, [visible]);

  const cells = useMemo(() => {
    const first = new Date(cursor);
    const startDay = (first.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const arr: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [cursor]);

  const agendaGroups = useMemo(() => {
    const today0 = new Date(); today0.setHours(0, 0, 0, 0);
    const limit = new Date(today0); limit.setDate(limit.getDate() + 90);
    const future = visible
      .filter((e) => {
        const d = new Date(`${e.fecha_inicio.slice(0, 10)}T00:00:00`);
        return d >= today0 && d <= limit;
      })
      .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));

    const map: Record<string, CalendarEvento[]> = {};
    future.forEach((e) => {
      const k = e.fecha_inicio.slice(0, 10);
      (map[k] ??= []).push(e);
    });
    return Object.keys(map).sort().map((k) => {
      const d = new Date(`${k}T00:00:00`);
      return {
        date: k,
        label: d.toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
        eventos: map[k],
      };
    });
  }, [visible]);

  const exportIcs = () => {
    downloadIcs("visoca_calendario.ics", buildIcs(visible));
  };

  const eventTime = (e: CalendarEvento) => {
    if (e.all_day || !e.fecha_inicio.includes("T")) return "Todo el día";
    return new Date(e.fecha_inicio).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  };

  const today = ymd(new Date());
  const monthLabel = cursor.toLocaleDateString("es", { month: "long", year: "numeric" });

  return (
    <div>
      <PageHeader
        breadcrumb="Calendario"
        title="Calendario de Calidad"
        subtitle="Eventos, vencimientos y compromisos (M2)"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportIcs}>
              <Download className="mr-1.5 h-4 w-4" /> Exportar .ics
            </Button>
            {perms.crearProyecto && (
              <Button size="sm" onClick={() => setFormOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Evento
              </Button>
            )}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {view === "mes" && (
            <>
              <Button variant="outline" size="icon" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="w-44 text-center font-display text-lg font-semibold capitalize text-foreground">{monthLabel}</span>
              <Button variant="outline" size="icon" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); }}>Hoy</Button>
            </>
          )}
          {view === "agenda" && (
            <span className="font-display text-lg font-semibold text-foreground">Próximos eventos</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-1 flex items-center gap-1 rounded-md border border-border p-0.5">
            <button
              onClick={() => setView("mes")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs ${view === "mes" ? "bg-elevated text-foreground" : "text-muted-foreground"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Mes
            </button>
            <button
              onClick={() => setView("agenda")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs ${view === "agenda" ? "bg-elevated text-foreground" : "text-muted-foreground"}`}
            >
              <CalendarRange className="h-3.5 w-3.5" /> Agenda
            </button>
          </div>
          <button
            onClick={() => setFilterTipo(null)}
            className={`rounded-md border px-2.5 py-1 text-xs ${!filterTipo ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
          >Todos</button>
          {Object.entries(TIPO_LABEL).map(([tipo, label]) => (
            <button
              key={tipo}
              onClick={() => setFilterTipo(tipo)}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs ${filterTipo === tipo ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: EVENT_COLORS[tipo as keyof typeof EVENT_COLORS] }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "mes" && (
        <>
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-7 border-b border-border bg-elevated">
              {WEEKDAYS.map((d) => (
                <div key={d} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((date, i) => {
                const key = date ? ymd(date) : `e${i}`;
                const dayEvents = date ? (byDay[key] ?? []) : [];
                const isToday = key === today;
                return (
                  <div key={key} className={`min-h-[104px] border-b border-r border-border/60 p-1.5 ${!date ? "bg-surface/30" : ""}`}>
                    {date && (
                      <>
                        <div className={`mb-1 text-right text-xs ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
                          {isToday ? <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">{date.getDate()}</span> : date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((e) => (
                            <EventoPopover key={e.id} evento={e}>
                              <button
                                type="button"
                                className="block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium text-white"
                                style={{ backgroundColor: e.color ?? EVENT_COLORS[e.tipo as keyof typeof EVENT_COLORS] ?? "#555A6B" }}
                                title={e.titulo}
                              >
                                {e.titulo}
                              </button>
                            </EventoPopover>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="px-1 text-[10px] text-muted-foreground">+{dayEvents.length - 3} más</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {visible.length === 0 && (
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" /> No hay eventos registrados todavía.
            </p>
          )}
        </>
      )}

      {view === "agenda" && (
        <>
          {agendaGroups.length === 0 ? (
            <EmptyState
              icon={<CalendarRange className="h-10 w-10" />}
              title="Sin eventos próximos"
              description="No hay eventos próximos registrados."
            />
          ) : (
            <div className="space-y-6">
              {agendaGroups.map((group) => (
                <div key={group.date}>
                  <h3 className="mb-2 font-display text-sm font-semibold capitalize text-foreground">{group.label}</h3>
                  <div className="space-y-2">
                    {group.eventos.map((e) => {
                      const dot = e.color ?? EVENT_COLORS[e.tipo as keyof typeof EVENT_COLORS] ?? "#555A6B";
                      return (
                        <EventoPopover key={e.id} evento={e}>
                          <button
                            type="button"
                            className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:bg-elevated"
                          >
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dot }} />
                            <span className="flex-1 truncate font-medium text-foreground">{e.titulo}</span>
                            <span
                              className="shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold text-white"
                              style={{ backgroundColor: dot }}
                            >
                              {TIPO_LABEL[e.tipo] ?? e.tipo}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">{eventTime(e)}</span>
                          </button>
                        </EventoPopover>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <ManualEventoDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
