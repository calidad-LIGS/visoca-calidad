import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PROY_ESTATUS } from "@/lib/badges";
import { Progress } from "@/components/ui/progress";
import type { Proyecto } from "./ProyectoFormDialog";

const COLS = ["pendiente", "en_proceso", "finalizado", "cancelado"];

export function KanbanView({
  proyectos, editable, onOpen,
}: {
  proyectos: Proyecto[];
  editable: boolean;
  onOpen: (p: Proyecto) => void;
}) {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const grouped = useMemo(() => {
    const map: Record<string, Proyecto[]> = { pendiente: [], en_proceso: [], finalizado: [], cancelado: [] };
    proyectos.forEach((p) => { (map[p.estatus] ?? map.pendiente).push(p); });
    return map;
  }, [proyectos]);

  const move = useMutation({
    mutationFn: async ({ id, estatus }: { id: string; estatus: string }) => {
      const { error } = await supabase.from("proyectos").update({ estatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proyectos"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (!e.over) return;
    const id = String(e.active.id);
    const estatus = String(e.over.id);
    const proy = proyectos.find((p) => p.id === id);
    if (proy && proy.estatus !== estatus) move.mutate({ id, estatus });
  };

  const active = proyectos.find((p) => p.id === activeId) ?? null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLS.map((col) => (
          <Column key={col} id={col} count={grouped[col].length}>
            {grouped[col].map((p) => (
              <Card key={p.id} proyecto={p} editable={editable} onOpen={() => onOpen(p)} />
            ))}
          </Column>
        ))}
      </div>
      <DragOverlay>
        {active && <CardInner proyecto={active} />}
      </DragOverlay>
    </DndContext>
  );
}

function Column({ id, count, children }: { id: string; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const cfg = PROY_ESTATUS[id];
  return (
    <div ref={setNodeRef} className={`rounded-lg border bg-surface/40 p-3 transition-colors ${isOver ? "border-primary" : "border-border"}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold" style={cfg?.style}>
          {cfg?.label ?? id}
        </span>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Card({ proyecto, editable, onOpen }: { proyecto: Proyecto; editable: boolean; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: proyecto.id, disabled: !editable });
  return (
    <div
      ref={setNodeRef}
      {...(editable ? { ...listeners, ...attributes } : {})}
      onClick={onOpen}
      className={`cursor-pointer ${isDragging ? "opacity-30" : ""}`}
    >
      <CardInner proyecto={proyecto} />
    </div>
  );
}

function CardInner({ proyecto }: { proyecto: Proyecto }) {
  const avance = Math.round(proyecto.avance_calculado ?? 0);
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{proyecto.nombre}</p>
        {proyecto.alta_prioridad && <span className="h-2 w-2 shrink-0 rounded-full bg-danger" />}
      </div>
      {proyecto.responsable_nombre && (
        <p className="mt-1 text-xs text-muted-foreground">{proyecto.responsable_nombre}</p>
      )}
      <div className="mt-2 flex items-center gap-2">
        <Progress value={avance} className="h-1.5" />
        <span className="w-9 text-right text-xs text-muted-foreground">{avance}%</span>
      </div>
    </div>
  );
}
