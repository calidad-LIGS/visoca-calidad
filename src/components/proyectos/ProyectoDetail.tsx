import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Check, ChevronDown, ChevronRight, CalendarPlus, List, BarChart2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePermisos } from "@/lib/permisos";
import { useEmpresas, useAreas } from "@/hooks/useCatalogos";
import { upsertEvento, deleteEvento } from "@/lib/calendarSync";
import { StatusBadge, PROY_ESTATUS } from "@/lib/badges";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Proyecto } from "./ProyectoFormDialog";

interface Actividad {
  id: string;
  proyecto_id: string;
  nombre: string;
  estatus: string;
  avance: number | null;
  responsable_nombre: string | null;
  fecha_inicio_plan: string | null;
  fecha_fin_plan: string | null;
  orden: number | null;
  agregar_calendario: boolean | null;
}
interface Subtarea {
  id: string; actividad_id: string; descripcion: string;
  completada: boolean | null; fecha_limite: string | null; orden: number | null;
}

const ACT_ESTATUS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_proceso", label: "En proceso" },
  { value: "finalizado", label: "Finalizado" },
  { value: "cancelado", label: "Cancelado" },
];

export function ProyectoDetail({
  proyecto, onClose,
}: { proyecto: Proyecto | null; onClose: () => void }) {
  return (
    <Sheet open={!!proyecto} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-[760px]">
        {proyecto && <Body proyecto={proyecto} />}
      </SheetContent>
    </Sheet>
  );
}

function Body({ proyecto }: { proyecto: Proyecto }) {
  const qc = useQueryClient();
  const perms = usePermisos();
  const { data: empresas = [] } = useEmpresas();
  const { data: areas = [] } = useAreas();
  const [nuevaAct, setNuevaAct] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data: actividades = [] } = useQuery({
    queryKey: ["actividades", proyecto.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("actividades")
        .select("*")
        .eq("proyecto_id", proyecto.id)
        .order("orden", { nullsFirst: false })
        .order("created_at");
      if (error) throw error;
      return data as Actividad[];
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["actividades", proyecto.id] });
    qc.invalidateQueries({ queryKey: ["proyectos"] });
  };

  const addAct = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("actividades").insert({
        proyecto_id: proyecto.id,
        nombre: nuevaAct.trim(),
        estatus: "pendiente",
        avance: 0,
        orden: actividades.length,
      });
      if (error) throw error;
    },
    onSuccess: () => { setNuevaAct(""); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateAct = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Actividad> }) => {
      const { error } = await supabase.from("actividades").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => refresh(),
    onError: (e: Error) => toast.error(e.message),
  });

  const delAct = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("subtareas").delete().eq("actividad_id", id);
      const { error } = await supabase.from("actividades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => refresh(),
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleCal = useMutation({
    mutationFn: async (act: Actividad) => {
      const nuevo = !act.agregar_calendario;
      await supabase.from("actividades").update({ agregar_calendario: nuevo }).eq("id", act.id);
      if (nuevo && act.fecha_fin_plan) {
        await upsertEvento({
          tipo: "proyecto",
          titulo: `${proyecto.nombre}: ${act.nombre}`,
          fecha_inicio: act.fecha_fin_plan,
          referencia_id: act.id,
          referencia_tabla: "actividades",
          empresa_id: proyecto.empresa_id,
          area_id: proyecto.area_id,
        });
        toast.success("Agendado en calendario");
      } else {
        await deleteEvento(act.id, "actividades");
        toast.success("Quitado del calendario");
      }
    },
    onSuccess: () => refresh(),
    onError: (e: Error) => toast.error(e.message),
  });

  const empresaName = empresas.find((e) => e.id === proyecto.empresa_id)?.nombre ?? "—";
  const areaName = areas.find((a) => a.id === proyecto.area_id)?.nombre ?? "—";
  const avance = Math.round(proyecto.avance_calculado ?? 0);

  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-2">
          <SheetTitle>{proyecto.nombre}</SheetTitle>
          <StatusBadge cfg={PROY_ESTATUS[proyecto.estatus]} />
          {proyecto.alta_prioridad && (
            <span className="rounded-md bg-danger px-2 py-0.5 text-xs font-semibold text-white">Alta prioridad</span>
          )}
        </div>
      </SheetHeader>

      <div className="mt-4 space-y-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Avance del proyecto (auto)</span>
            <span className="font-display font-bold text-primary">{avance}%</span>
          </div>
          <Progress value={avance} />
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-4">
            <Meta label="Empresa" value={empresaName} />
            <Meta label="Área" value={areaName} />
            <Meta label="Responsable" value={proyecto.responsable_nombre ?? "—"} />
            <Meta label="Fin plan" value={proyecto.fecha_fin_plan ?? "—"} />
          </div>
          {proyecto.objetivo && (
            <p className="mt-3 border-t border-border pt-3 text-sm text-foreground">{proyecto.objetivo}</p>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-foreground">
              Actividades ({actividades.length})
            </h3>
          </div>

          {perms.editarProyecto && (
            <div className="mb-3 flex gap-2">
              <Input
                value={nuevaAct}
                onChange={(e) => setNuevaAct(e.target.value)}
                placeholder="Nueva actividad…"
                onKeyDown={(e) => { if (e.key === "Enter" && nuevaAct.trim()) addAct.mutate(); }}
              />
              <Button size="sm" disabled={!nuevaAct.trim() || addAct.isPending} onClick={() => addAct.mutate()}>
                <Plus className="mr-1 h-4 w-4" /> Agregar
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {actividades.map((act) => (
              <ActividadRow
                key={act.id}
                act={act}
                editable={perms.editarProyecto}
                expanded={expanded.has(act.id)}
                onToggleExpand={() => setExpanded((s) => {
                  const n = new Set(s);
                  n.has(act.id) ? n.delete(act.id) : n.add(act.id);
                  return n;
                })}
                onUpdate={(patch) => updateAct.mutate({ id: act.id, patch })}
                onDelete={() => delAct.mutate(act.id)}
                onToggleCal={() => toggleCal.mutate(act)}
              />
            ))}
            {actividades.length === 0 && (
              <p className="rounded-md border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
                Sin actividades aún.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function ActividadRow({
  act, editable, expanded, onToggleExpand, onUpdate, onDelete, onToggleCal,
}: {
  act: Actividad;
  editable: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (patch: Partial<Actividad>) => void;
  onDelete: () => void;
  onToggleCal: () => void;
}) {
  return (
    <div className="rounded-md border border-border bg-card">
      <div className="flex items-center gap-2 p-3">
        <button onClick={onToggleExpand} className="text-muted-foreground hover:text-foreground">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <span className="flex-1 truncate text-sm text-foreground">{act.nombre}</span>
        <Select
          value={act.estatus}
          onValueChange={(v) => onUpdate({ estatus: v, avance: v === "finalizado" ? 100 : act.avance })}
          disabled={!editable}
        >
          <SelectTrigger className="h-7 w-[130px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ACT_ESTATUS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex w-28 items-center gap-2">
          <Progress value={act.avance ?? 0} className="h-1.5" />
          <span className="w-9 text-right text-xs text-muted-foreground">{act.avance ?? 0}%</span>
        </div>
        {editable && (
          <>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Agendar fin en calendario" onClick={onToggleCal}>
              <CalendarPlus className={act.agregar_calendario ? "h-4 w-4 text-accent" : "h-4 w-4"} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-danger" />
            </Button>
          </>
        )}
      </div>
      {expanded && (
        <div className="border-t border-border p-3">
          {editable && (
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Avance
                <Input
                  type="number" min={0} max={100}
                  defaultValue={act.avance ?? 0}
                  className="h-7 w-20"
                  onBlur={(e) => {
                    const v = Math.max(0, Math.min(100, Number(e.target.value)));
                    if (v !== (act.avance ?? 0)) onUpdate({ avance: v });
                  }}
                />
              </label>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Fin plan
                <Input
                  type="date" defaultValue={act.fecha_fin_plan ?? ""}
                  className="h-7 w-36"
                  onBlur={(e) => { if (e.target.value !== (act.fecha_fin_plan ?? "")) onUpdate({ fecha_fin_plan: e.target.value || null }); }}
                />
              </label>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Responsable
                <Input
                  defaultValue={act.responsable_nombre ?? ""}
                  className="h-7 w-40"
                  onBlur={(e) => { if (e.target.value !== (act.responsable_nombre ?? "")) onUpdate({ responsable_nombre: e.target.value || null }); }}
                />
              </label>
            </div>
          )}
          <Subtareas actividadId={act.id} editable={editable} />
        </div>
      )}
    </div>
  );
}

function Subtareas({ actividadId, editable }: { actividadId: string; editable: boolean }) {
  const qc = useQueryClient();
  const [nueva, setNueva] = useState("");
  const { data: subtareas = [] } = useQuery({
    queryKey: ["subtareas", actividadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subtareas").select("*").eq("actividad_id", actividadId).order("orden", { nullsFirst: false }).order("created_at");
      if (error) throw error;
      return data as Subtarea[];
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["subtareas", actividadId] });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("subtareas").insert({
        actividad_id: actividadId, descripcion: nueva.trim(), completada: false, orden: subtareas.length,
      });
      if (error) throw error;
    },
    onSuccess: () => { setNueva(""); refresh(); },
  });
  const toggle = useMutation({
    mutationFn: async (st: Subtarea) => {
      const { error } = await supabase.from("subtareas").update({ completada: !st.completada }).eq("id", st.id);
      if (error) throw error;
    },
    onSuccess: () => refresh(),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("subtareas").delete().eq("id", id); },
    onSuccess: () => refresh(),
  });

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subtareas</p>
      {subtareas.map((st) => (
        <div key={st.id} className="flex items-center gap-2 text-sm">
          <Checkbox checked={!!st.completada} onCheckedChange={() => toggle.mutate(st)} disabled={!editable} />
          <span className={st.completada ? "flex-1 text-muted-foreground line-through" : "flex-1 text-foreground"}>{st.descripcion}</span>
          {editable && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => del.mutate(st.id)}>
              <Trash2 className="h-3.5 w-3.5 text-danger" />
            </Button>
          )}
        </div>
      ))}
      {editable && (
        <div className="flex gap-2 pt-1">
          <Input
            value={nueva} onChange={(e) => setNueva(e.target.value)} placeholder="Nueva subtarea…"
            className="h-7 text-sm"
            onKeyDown={(e) => { if (e.key === "Enter" && nueva.trim()) add.mutate(); }}
          />
          <Button size="icon" className="h-7 w-7" disabled={!nueva.trim()} onClick={() => add.mutate()}>
            <Check className="h-4 w-4" />
          </Button>
        </div>
      )}
      {subtareas.length === 0 && !editable && (
        <p className="text-xs text-muted-foreground">Sin subtareas.</p>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="uppercase tracking-wider">{label}</p>
      <p className="mt-0.5 text-foreground">{value}</p>
    </div>
  );
}
