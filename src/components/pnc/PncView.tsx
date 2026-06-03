import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { Plus, FileDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresas, useAreas } from "@/hooks/useCatalogos";
import { usePermisos } from "@/lib/permisos";
import { diasInfo } from "@/lib/pncUtils";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Td } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { KpiCard } from "@/components/common/KpiCard";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  StatusBadge, PNC_ESTATUS, PNC_RAZON_LABEL, PNC_ORIGEN_LABEL, PNC_METODOLOGIA_LABEL,
} from "@/lib/badges";
import { PncFormDialog } from "./PncFormDialog";
import { PncDetail, type Pnc } from "./PncDetail";

export function PncView() {
  const perms = usePermisos();
  const { data: empresas = [] } = useEmpresas();
  const { data: areas = [] } = useAreas();
  const [formOpen, setFormOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [fEstatus, setFEstatus] = useState("all");
  const [fEmpresa, setFEmpresa] = useState("all");
  const [fOrigen, setFOrigen] = useState("all");

  const { data: pncs = [], isLoading } = useQuery({
    queryKey: ["pnc"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pnc").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Pnc[];
    },
    staleTime: 30_000,
  });

  const areaName = (id: string | null) => areas.find((a) => a.id === id)?.nombre ?? "—";

  const kpis = useMemo(() => {
    const abiertos = pncs.filter((p) => p.estatus !== "finalizado").length;
    const vencidos = pncs.filter((p) => p.estatus !== "finalizado" && p.fecha_compromiso && new Date(p.fecha_compromiso) < new Date()).length;
    const verificacion = pncs.filter((p) => p.estatus === "verificacion").length;
    const now = new Date();
    const cerradosMes = pncs.filter((p) => p.fecha_cierre && new Date(p.fecha_cierre).getMonth() === now.getMonth() && new Date(p.fecha_cierre).getFullYear() === now.getFullYear()).length;
    return { abiertos, vencidos, verificacion, cerradosMes };
  }, [pncs]);

  const filtered = useMemo(() => {
    let rows = pncs;
    if (fEstatus !== "all") rows = rows.filter((p) => p.estatus === fEstatus);
    if (fEmpresa !== "all") rows = rows.filter((p) => p.empresa_id === fEmpresa);
    if (fOrigen !== "all") rows = rows.filter((p) => p.origen === fOrigen);
    return rows;
  }, [pncs, fEstatus, fEmpresa, fOrigen]);

  const exportXLS = () => {
    const rows = filtered.map((p) => ({
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
        <KpiCard label="En verificación" value={kpis.verificacion} accent="warning" />
        <KpiCard label="Cerrados este mes" value={kpis.cerradosMes} accent="accent" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Filt value={fEstatus} onChange={setFEstatus} placeholder="Estatus" options={Object.entries(PNC_ESTATUS).map(([value, c]) => ({ value, label: c.label }))} />
        <Filt value={fEmpresa} onChange={setFEmpresa} placeholder="Empresa" options={empresas.map((e) => ({ value: e.id, label: e.nombre }))} />
        <Filt value={fOrigen} onChange={setFOrigen} placeholder="Origen" options={Object.entries(PNC_ORIGEN_LABEL).map(([value, label]) => ({ value, label }))} />
      </div>

      {!isLoading && pncs.length === 0 ? (
        <EmptyState title="Sin no conformidades registradas" description="¡Eso es una buena señal!"
          action={perms.crearPnc && <Button onClick={() => setFormOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> Nuevo PNC</Button>} />
      ) : (
        <DataTable headers={["#", "Descripción", "Estatus", "Origen", "Área", "Razón", "F. Origen", "F. Compromiso", "Días"]} isEmpty={filtered.length === 0} empty="Sin PNC para los filtros aplicados.">
          {filtered.map((p) => {
            const info = diasInfo(p.fecha_origen, p.fecha_compromiso, p.estatus === "finalizado");
            const dotColor = { accent: "#1BC8A0", warning: "#F5A623", danger: "#E54B4B" }[info.color];
            return (
              <tr key={p.id} className="cursor-pointer" onClick={() => setDetailId(p.id)}>
                <Td><span className="font-mono text-primary">{p.numero_anio}</span></Td>
                <Td className="max-w-[18rem] truncate text-foreground">{p.descripcion}</Td>
                <Td><StatusBadge cfg={PNC_ESTATUS[p.estatus]} /></Td>
                <Td className="text-xs">{PNC_ORIGEN_LABEL[p.origen]}</Td>
                <Td>{areaName(p.area_id)}</Td>
                <Td className="text-xs">{p.razon ? PNC_RAZON_LABEL[p.razon] : "—"}</Td>
                <Td className="whitespace-nowrap text-xs">{p.fecha_origen}</Td>
                <Td className="whitespace-nowrap text-xs">{p.fecha_compromiso ?? "—"}</Td>
                <Td><span className="font-semibold" style={{ color: dotColor }}>{info.dias}</span></Td>
              </tr>
            );
          })}
        </DataTable>
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
