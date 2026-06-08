import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Plus, FileDown, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresas, useAreas } from "@/hooks/useCatalogos";
import { usePermisos } from "@/lib/permisos";
import { diasInfo } from "@/lib/pncUtils";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Td, Tr } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { KpiCard } from "@/components/common/KpiCard";
import { Pagination } from "@/components/common/Pagination";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  StatusBadge, PNC_ESTATUS, PNC_RAZON_LABEL, PNC_ORIGEN_LABEL, PNC_METODOLOGIA_LABEL,
} from "@/lib/badges";
import { PncFormDialog } from "./PncFormDialog";
import { PncDetail, type Pnc } from "./PncDetail";

const PAGE_SIZE = 25;

export function PncView() {
  const perms = usePermisos();
  const { data: empresas = [] } = useEmpresas();
  const { data: areas = [] } = useAreas();
  const [formOpen, setFormOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [fEstatus, setFEstatus] = useState("all");
  const [fEmpresa, setFEmpresa] = useState("all");
  const [fOrigen, setFOrigen] = useState("all");
  const [page, setPage] = useState(0);

  const { pncId } = useSearch({ from: "/_authenticated/no-conformidades" });

  useEffect(() => {
    if (pncId) setDetailId(pncId);
  }, [pncId]);

  // Reset de página al cambiar filtros
  useEffect(() => { setPage(0); }, [fEstatus, fEmpresa, fOrigen]);

  const hasFilters = fEstatus !== "all" || fEmpresa !== "all" || fOrigen !== "all";

  // Tabla paginada (server-side)
  const { data: pncs = [], isLoading } = useQuery({
    queryKey: ["pnc", page, fEstatus, fEmpresa, fOrigen],
    queryFn: async () => {
      let q = supabase.from("pnc").select("*");
      if (fEstatus !== "all") q = q.eq("estatus", fEstatus);
      if (fEmpresa !== "all") q = q.eq("empresa_id", fEmpresa);
      if (fOrigen !== "all") q = q.eq("origen", fOrigen);
      const { data, error } = await q
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (error) throw error;
      return data as Pnc[];
    },
    staleTime: 30_000,
  });

  // Conteo total para la paginación (mismos filtros, sin datos)
  const { data: total = 0 } = useQuery({
    queryKey: ["pnc-count", fEstatus, fEmpresa, fOrigen],
    queryFn: async () => {
      let q = supabase.from("pnc").select("*", { count: "exact", head: true });
      if (fEstatus !== "all") q = q.eq("estatus", fEstatus);
      if (fEmpresa !== "all") q = q.eq("empresa_id", fEmpresa);
      if (fOrigen !== "all") q = q.eq("origen", fOrigen);
      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 30_000,
  });

  // KPIs sobre el total (sin paginar), columnas mínimas
  const { data: kpiRows = [] } = useQuery({
    queryKey: ["pnc-kpi"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pnc").select("estatus, fecha_compromiso, fecha_cierre");
      if (error) throw error;
      return data as { estatus: string; fecha_compromiso: string | null; fecha_cierre: string | null }[];
    },
    staleTime: 30_000,
  });

  const areaName = (id: string | null) => areas.find((a) => a.id === id)?.nombre ?? "—";
  const areaCell = (p: Pnc) => {
    const ids = p.area_ids ?? [];
    if (ids.length === 0) return areaName(p.area_id);
    const first = areas.find((a) => a.id === ids[0])?.nombre ?? "—";
    return ids.length > 1 ? `${first} +${ids.length - 1}` : first;
  };

  const kpis = useMemo(() => {
    const abiertos = kpiRows.filter((p) => p.estatus === "pendiente").length;
    const vencidos = kpiRows.filter((p) => p.estatus === "pendiente" && p.fecha_compromiso && new Date(p.fecha_compromiso) < new Date()).length;
    const cerrados = kpiRows.filter((p) => p.estatus === "cerrado").length;
    const now = new Date();
    const cerradosMes = kpiRows.filter((p) => p.fecha_cierre && new Date(p.fecha_cierre).getMonth() === now.getMonth() && new Date(p.fecha_cierre).getFullYear() === now.getFullYear()).length;
    return { abiertos, vencidos, cerrados, cerradosMes };
  }, [kpiRows]);

  // Exporta TODOS los registros filtrados (sin paginar)
  const exportXLS = async () => {
    let q = supabase.from("pnc").select("*");
    if (fEstatus !== "all") q = q.eq("estatus", fEstatus);
    if (fEmpresa !== "all") q = q.eq("empresa_id", fEmpresa);
    if (fOrigen !== "all") q = q.eq("origen", fOrigen);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error || !data) {
      toast.error("No se pudo exportar los PNC.");
      return;
    }
    const rows = (data as Pnc[]).map((p) => ({
      "#": p.numero_anio, Descripción: p.descripcion, Estatus: PNC_ESTATUS[p.estatus]?.label,
      Origen: PNC_ORIGEN_LABEL[p.origen], Área: areaName(p.area_id),
      Proceso: p.proceso_texto ?? "", Razón: p.razon ? PNC_RAZON_LABEL[p.razon] : "",
      Metodología: p.metodologia ? PNC_METODOLOGIA_LABEL[p.metodologia] : "",
      "F. Origen": p.fecha_origen, "F. Compromiso": p.fecha_compromiso ?? "",
      Solución: p.solucion ?? "", "F. Cierre": p.fecha_cierre ?? "", Observaciones: p.observaciones ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PNC");
    XLSX.writeFile(wb, "GAP-CAL-1.1-F01_PNC.xlsx");
  };

  return (
    <div>
      <PageHeader
        breadcrumb="No Conformidades" title="Producto No Conforme"
        actions={
          <>
            {perms.exportar && <Button variant="outline" size="sm" onClick={exportXLS}><FileDown className="mr-1.5 h-4 w-4" /> Exportar Excel</Button>}
            {perms.crearPnc && <Button size="sm" onClick={() => setFormOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> Nuevo PNC</Button>}
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total abiertos" value={kpis.abiertos} accent="primary" />
        <KpiCard label="Vencidos" value={kpis.vencidos} accent="danger" sub="Requieren atención" />
        <KpiCard label="Cerrados (total)" value={kpis.cerrados} accent="accent" />
        <KpiCard label="Cerrados este mes" value={kpis.cerradosMes} accent="accent" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Filt value={fEstatus} onChange={setFEstatus} placeholder="Estatus" options={Object.entries(PNC_ESTATUS).map(([value, c]) => ({ value, label: c.label }))} />
        <Filt value={fEmpresa} onChange={setFEmpresa} placeholder="Empresa" options={empresas.map((e) => ({ value: e.id, label: e.nombre }))} />
        <Filt value={fOrigen} onChange={setFOrigen} placeholder="Origen" options={Object.entries(PNC_ORIGEN_LABEL).map(([value, label]) => ({ value, label }))} />
      </div>

      <div className="mb-4">
        {hasFilters ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{total} resultados</span>
            <button
              onClick={() => { setFEstatus("all"); setFEmpresa("all"); setFOrigen("all"); setPage(0); }}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <X className="h-3 w-3" /> Limpiar filtros
            </button>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">{total} registros</span>
        )}
      </div>

      {!isLoading && total === 0 && !hasFilters ? (
        <EmptyState title="Sin no conformidades registradas" description="¡Eso es una buena señal!"
          action={perms.crearPnc && <Button onClick={() => setFormOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> Nuevo PNC</Button>} />
      ) : (
        <>
          <DataTable headers={["#", "Descripción", "Estatus", "Origen", "Área", "Razón", "F. Origen", "F. Compromiso", "Días / Cierre"]} isLoading={isLoading} isEmpty={pncs.length === 0} empty="Sin PNC para los filtros aplicados.">
            {pncs.map((p) => {
              const info = diasInfo(p.fecha_origen, p.fecha_compromiso, p.estatus === "cerrado");
              const dotColor = { accent: "#1BC8A0", warning: "#F5A623", danger: "#E54B4B" }[info.color];
              return (
                <Tr key={p.id} active={detailId === p.id} onClick={() => setDetailId(p.id)}>
                  <Td><span className="font-mono text-primary">{p.numero_anio}</span></Td>
                  <Td className="max-w-[18rem] truncate text-foreground">{p.descripcion}</Td>
                  <Td><StatusBadge cfg={PNC_ESTATUS[p.estatus]} /></Td>
                  <Td className="text-xs">{PNC_ORIGEN_LABEL[p.origen]}</Td>
                  <Td>{areaCell(p)}</Td>
                  <Td className="text-xs">{p.razon ? PNC_RAZON_LABEL[p.razon] : "—"}</Td>
                  <Td className="whitespace-nowrap text-xs">{p.fecha_origen}</Td>
                  <Td className="whitespace-nowrap text-xs">{p.fecha_compromiso ?? "—"}</Td>
                  <Td>
                    {p.estatus === "pendiente" ? (
                      <span className="font-semibold" style={{ color: dotColor }}>{info.dias}</span>
                    ) : (
                      <span className="whitespace-nowrap text-xs text-accent">{p.fecha_cierre ?? "—"}</span>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </DataTable>

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} noun="PNC" />
        </>
      )}

      <PncFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <PncDetail pncId={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}

function Filt({ value, onChange, placeholder, options }: { value: string; onChange: (v: string) => void; placeholder: string; options: { value: string; label: string }[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-auto min-w-[140px]"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}: Todos</SelectItem>
        {options.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
      </SelectContent>
    </Select>
  );
}
