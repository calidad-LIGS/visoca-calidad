import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Eye, Pencil, AlertTriangle, LayoutList, GanttChartSquare, Columns3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresas, useAreas } from "@/hooks/useCatalogos";
import { usePermisos } from "@/lib/permisos";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Td, Tr } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { KpiCard } from "@/components/common/KpiCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge, PROY_ESTATUS } from "@/lib/badges";
import { ProyectoFormDialog, type Proyecto } from "./ProyectoFormDialog";
import { ProyectoDetail } from "./ProyectoDetail";
import { KanbanView } from "./KanbanView";
import { GanttView } from "./GanttView";

export function ProyectosView() {
  const perms = usePermisos();
  const { data: empresas = [] } = useEmpresas();
  const { data: areas = [] } = useAreas();

  const [view, setView] = useState("lista");
  const [fEstatus, setFEstatus] = useState("all");
  const [fEmpresa, setFEmpresa] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Proyecto | null>(null);
  const [detail, setDetail] = useState<Proyecto | null>(null);

  const { data: proyectos = [], isLoading } = useQuery({
    queryKey: ["proyectos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proyectos")
        .select("id, nombre, objetivo, tipo, proceso_perteneciente, empresa_id, area_id, responsable_usuario_id, responsable_nombre, estatus, alta_prioridad, avance_calculado, fecha_inicio_plan, fecha_fin_plan, nota_observacion")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Proyecto[];
    },
    staleTime: 30_000,
  });

  // keep detail synced with fresh data
  const detailLive = detail ? proyectos.find((p) => p.id === detail.id) ?? detail : null;

  const empresaName = (id: string | null) => empresas.find((e) => e.id === id)?.nombre ?? "—";
  const areaName = (id: string | null) => areas.find((a) => a.id === id)?.nombre ?? "—";

  const kpis = useMemo(() => {
    const activos = proyectos.filter((p) => p.estatus === "en_proceso").length;
    const prioridad = proyectos.filter((p) => p.alta_prioridad && p.estatus !== "finalizado" && p.estatus !== "cancelado").length;
    const finalizados = proyectos.filter((p) => p.estatus === "finalizado").length;
    const avgAvance = proyectos.length
      ? Math.round(proyectos.reduce((s, p) => s + (p.avance_calculado ?? 0), 0) / proyectos.length)
      : 0;
    return { activos, prioridad, finalizados, avgAvance };
  }, [proyectos]);

  const monitor = useMemo(
    () => proyectos.filter((p) => p.alta_prioridad && p.estatus !== "finalizado" && p.estatus !== "cancelado"),
    [proyectos],
  );

  const filtered = useMemo(() => {
    let rows = proyectos;
    if (fEstatus !== "all") rows = rows.filter((p) => p.estatus === fEstatus);
    if (fEmpresa !== "all") rows = rows.filter((p) => p.empresa_id === fEmpresa);
    return rows;
  }, [proyectos, fEstatus, fEmpresa]);

  return (
    <div>
      <PageHeader
        breadcrumb="Proyectos"
        title="Proyectos y Cronogramas"
        subtitle="Seguimiento de actividades y avance (M3)"
        actions={
          perms.crearProyecto && (
            <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="mr-1.5 h-4 w-4" /> Nuevo Proyecto
            </Button>
          )
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Activos" value={kpis.activos} accent="primary" />
        <KpiCard label="Alta prioridad" value={kpis.prioridad} accent="danger" icon={<AlertTriangle className="h-4 w-4" />} />
        <KpiCard label="Finalizados" value={kpis.finalizados} accent="accent" />
        <KpiCard label="Avance promedio" value={`${kpis.avgAvance}%`} accent="warning" />
      </div>

      {monitor.length > 0 && (
        <div className="mb-6 rounded-lg border border-danger/40 bg-danger/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-danger">
            <AlertTriangle className="h-4 w-4" /> Monitor de alta prioridad
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {monitor.map((p) => (
              <button
                key={p.id}
                onClick={() => setDetail(p)}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 text-left hover:border-primary/60"
              >
                <span className="truncate text-sm text-foreground">{p.nombre}</span>
                <span className="shrink-0 text-xs font-semibold text-primary">{Math.round(p.avance_calculado ?? 0)}%</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="lista"><LayoutList className="mr-1.5 h-4 w-4" /> Lista</TabsTrigger>
            <TabsTrigger value="gantt"><GanttChartSquare className="mr-1.5 h-4 w-4" /> Gantt</TabsTrigger>
            <TabsTrigger value="kanban"><Columns3 className="mr-1.5 h-4 w-4" /> Kanban</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <FilterSelect value={fEstatus} onChange={setFEstatus} placeholder="Estatus"
            options={Object.entries(PROY_ESTATUS).map(([value, c]) => ({ value, label: c.label }))} />
          <FilterSelect value={fEmpresa} onChange={setFEmpresa} placeholder="Empresa"
            options={empresas.map((e) => ({ value: e.id, label: e.nombre }))} />
        </div>
      </div>

      {!isLoading && proyectos.length === 0 ? (
        <EmptyState
          icon={<GanttChartSquare className="h-10 w-10" />}
          title="No hay proyectos registrados"
          description="Crea tu primer proyecto para empezar el seguimiento."
          action={perms.crearProyecto && (
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="mr-1.5 h-4 w-4" /> Nuevo Proyecto
            </Button>
          )}
        />
      ) : view === "lista" ? (
        <DataTable
          headers={["Nombre", "Empresa", "Área", "Responsable", "Avance", "Estatus", ""]}
          isLoading={isLoading}
          isEmpty={filtered.length === 0}
          empty="Sin proyectos para los filtros aplicados."
        >
          {filtered.map((p) => (
            <Tr key={p.id} active={detailLive?.id === p.id} className="group">
              <Td className="text-foreground">
                <button className="flex items-center gap-2 hover:text-primary" onClick={() => setDetail(p)}>
                  {p.alta_prioridad && <span className="h-2 w-2 rounded-full bg-danger" />}
                  {p.nombre}
                </button>
              </Td>
              <Td>{empresaName(p.empresa_id)}</Td>
              <Td>{areaName(p.area_id)}</Td>
              <Td>{p.responsable_nombre ?? "—"}</Td>
              <Td>
                <div className="flex w-32 items-center gap-2">
                  <Progress value={p.avance_calculado ?? 0} className="h-1.5" />
                  <span className="w-9 text-right text-xs text-muted-foreground">{Math.round(p.avance_calculado ?? 0)}%</span>
                </div>
              </Td>
              <Td><StatusBadge cfg={PROY_ESTATUS[p.estatus]} /></Td>
              <Td>
                <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="icon" onClick={() => setDetail(p)}><Eye className="h-4 w-4" /></Button>
                  {perms.editarProyecto && (
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  )}
                </div>
              </Td>
            </Tr>
          ))}
        </DataTable>
      ) : view === "gantt" ? (
        <GanttView proyectos={filtered} onOpen={setDetail} />
      ) : (
        <KanbanView proyectos={filtered} editable={perms.editarProyecto} onOpen={setDetail} />
      )}

      <ProyectoFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} />
      <ProyectoDetail proyecto={detailLive} onClose={() => setDetail(null)} />
    </div>
  );
}

function FilterSelect({
  value, onChange, placeholder, options,
}: {
  value: string; onChange: (v: string) => void; placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-auto min-w-[140px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}: Todas</SelectItem>
        {options.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
      </SelectContent>
    </Select>
  );
}
