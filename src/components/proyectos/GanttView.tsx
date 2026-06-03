import { useMemo } from "react";
import { PROY_ESTATUS } from "@/lib/badges";
import type { Proyecto } from "./ProyectoFormDialog";

const DAY = 86400000;

export function GanttView({
  proyectos, onOpen,
}: { proyectos: Proyecto[]; onOpen: (p: Proyecto) => void }) {
  const rows = proyectos.filter((p) => p.fecha_inicio_plan && p.fecha_fin_plan);

  const { min, max, months } = useMemo(() => {
    if (rows.length === 0) return { min: 0, max: 0, months: [] as { label: string; offset: number; width: number }[] };
    const starts = rows.map((p) => new Date(p.fecha_inicio_plan!).getTime());
    const ends = rows.map((p) => new Date(p.fecha_fin_plan!).getTime());
    const min = Math.min(...starts);
    const max = Math.max(...ends);
    const total = Math.max(max - min, DAY);
    const months: { label: string; offset: number; width: number }[] = [];
    const cur = new Date(min);
    cur.setDate(1);
    while (cur.getTime() <= max) {
      const start = Math.max(cur.getTime(), min);
      const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1).getTime();
      const end = Math.min(next, max);
      months.push({
        label: cur.toLocaleDateString("es", { month: "short", year: "2-digit" }),
        offset: ((start - min) / total) * 100,
        width: ((end - start) / total) * 100,
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    return { min, max, months };
  }, [rows]);

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        No hay proyectos con fechas de inicio y fin planificadas para mostrar el Gantt.
      </p>
    );
  }

  const total = Math.max(max - min, DAY);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <div className="min-w-[720px]">
        <div className="flex border-b border-border bg-elevated text-xs text-muted-foreground">
          <div className="w-56 shrink-0 px-3 py-2 font-semibold uppercase tracking-wider">Proyecto</div>
          <div className="relative flex-1">
            {months.map((m, i) => (
              <div key={i} className="absolute top-0 h-full border-l border-border/60 px-1 py-2"
                style={{ left: `${m.offset}%`, width: `${m.width}%` }}>
                {m.label}
              </div>
            ))}
            <div className="py-2">&nbsp;</div>
          </div>
        </div>
        {rows.map((p) => {
          const start = new Date(p.fecha_inicio_plan!).getTime();
          const end = new Date(p.fecha_fin_plan!).getTime();
          const offset = ((start - min) / total) * 100;
          const width = Math.max(((end - start) / total) * 100, 1.5);
          const avance = Math.round(p.avance_calculado ?? 0);
          const cfg = PROY_ESTATUS[p.estatus];
          return (
            <div key={p.id} className="flex items-center border-b border-border/60 hover:bg-card/50">
              <button onClick={() => onOpen(p)} className="w-56 shrink-0 truncate px-3 py-2 text-left text-sm text-foreground hover:text-primary">
                {p.nombre}
              </button>
              <div className="relative h-8 flex-1">
                <button
                  onClick={() => onOpen(p)}
                  className="absolute top-1.5 h-5 overflow-hidden rounded"
                  style={{ left: `${offset}%`, width: `${width}%`, backgroundColor: "#2E3347" }}
                  title={`${p.fecha_inicio_plan} → ${p.fecha_fin_plan} · ${avance}%`}
                >
                  <span className="block h-full" style={{ width: `${avance}%`, backgroundColor: cfg?.style.backgroundColor ?? "#3B7DD8" }} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
