import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, CalendarDays, Download, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePermisos } from "@/lib/permisos";
import { EVENT_COLORS } from "@/lib/calendarSync";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ManualEventoDialog } from "./ManualEventoDialog";

interface Evento {
  id: string;
  tipo: string;
  titulo: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  color: string | null;
}

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

  const { data: eventos = [] } = useQuery({
    queryKey: ["eventos_calendario"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eventos_calendario")
        .select("id, tipo, titulo, descripcion, fecha_inicio, fecha_fin, color")
        .order("fecha_inicio");
      if (error) throw error;
      return data as Evento[];
    },
    staleTime: 30_000,
  });

  const visible = filterTipo ? eventos.filter((e) => e.tipo === filterTipo) : eventos;

  const byDay = useMemo(() => {
    const map: Record<string, Evento[]> = {};
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

  const exportIcs = () => {
    const pad = (s: string) => s.replace(/[-:]/g, "").slice(0, 8);
    const lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//VISOCA-Calidad//ES",
    ];
    visible.forEach((e) => {
      const start = pad(e.fecha_inicio);
      const end = e.fecha_fin ? pad(e.fecha_fin) : start;
      lines.push(
        "BEGIN:VEVENT",
        `UID:${e.id}@visoca`,
        `DTSTART;VALUE=DATE:${start}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${(e.titulo || "").replace(/\n/g, " ")}`,
        e.descripcion ? `DESCRIPTION:${e.descripcion.replace(/\n/g, " ")}` : "",
        "END:VEVENT",
      );
    });
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.filter(Boolean).join("\r\n")], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "visoca_calendario.ics"; a.click();
    URL.revokeObjectURL(url);
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
          <Button variant="outline" size="icon" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="w-44 text-center font-display text-lg font-semibold capitalize text-foreground">{monthLabel}</span>
          <Button variant="outline" size="icon" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); }}>Hoy</Button>
        </div>
        <div className="flex flex-wrap gap-2">
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
                        <div
                          key={e.id}
                          className="truncate rounded px-1.5 py-0.5 text-[11px] font-medium text-white"
                          style={{ backgroundColor: e.color ?? EVENT_COLORS[e.tipo as keyof typeof EVENT_COLORS] ?? "#555A6B" }}
                          title={e.titulo}
                        >
                          {e.titulo}
                        </div>
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

      <ManualEventoDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
