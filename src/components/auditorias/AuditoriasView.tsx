import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useUsuarios } from "@/hooks/useCatalogos";
import { usePermisos } from "@/lib/permisos";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Td } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { KpiCard } from "@/components/common/KpiCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, OutlineBadge, AUD_ESTATUS } from "@/lib/badges";
import { AuditoriaFormDialog } from "./AuditoriaFormDialog";

interface Auditoria {
  id: string; codigo_auditoria: string; tipo: string; anio: number;
  empresa_ids: string[]; certificacion: string | null;
  fecha_inicio: string | null; fecha_fin: string | null;
  auditor_lider_id: string | null; estatus: string;
}

export function AuditoriasView() {
  const perms = usePermisos();
  const navigate = useNavigate();
  const { data: usuarios = [] } = useUsuarios();
  const [tab, setTab] = useState("todas");
  const [formOpen, setFormOpen] = useState(false);

  const { data: auditorias = [], isLoading } = useQuery({
    queryKey: ["auditorias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auditorias")
        .select("id, codigo_auditoria, tipo, anio, empresa_ids, certificacion, fecha_inicio, fecha_fin, auditor_lider_id, estatus")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Auditoria[];
    },
    staleTime: 30_000,
  });

  const { data: hallazgosCount = {} } = useQuery({
    queryKey: ["hallazgos-count"],
    queryFn: async () => {
      const { data, error } = await supabase.from("auditoria_hallazgos").select("auditoria_id, tipo");
      if (error) throw error;
      const map: Record<string, { mayor: number; menor: number; om: number }> = {};
      for (const h of data) {
        const k = h.auditoria_id as string;
        map[k] ??= { mayor: 0, menor: 0, om: 0 };
        if (h.tipo === "nc_mayor") map[k].mayor++;
        else if (h.tipo === "nc_menor") map[k].menor++;
        else map[k].om++;
      }
      return map;
    },
  });

  const kpis = useMemo(() => {
    const year = new Date().getFullYear();
    const esteAnio = auditorias.filter((a) => a.anio === year).length;
    const conHallazgos = auditorias.filter((a) => a.estatus === "con_hallazgos").length;
    const cerradas = auditorias.filter((a) => a.estatus === "cerrada").length;
    const in30 = new Date(); in30.setDate(in30.getDate() + 30);
    const proximas = auditorias.filter((a) => a.fecha_inicio && new Date(a.fecha_inicio) >= new Date() && new Date(a.fecha_inicio) <= in30).length;
    return { esteAnio, conHallazgos, cerradas, proximas };
  }, [auditorias]);

  const filtered = auditorias.filter((a) => tab === "todas" || a.tipo === tab);
  const auditorName = (id: string | null) => usuarios.find((u) => u.id === id)?.nombre_completo ?? "—";

  return (
    <div>
      <PageHeader breadcrumb="Auditorías" title="Auditorías"
        actions={perms.crearAuditoria && <Button size="sm" onClick={() => setFormOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> Nueva Auditoría</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Este año" value={kpis.esteAnio} accent="primary" sub="Meta: 2 internas/año" />
        <KpiCard label="Con hallazgos" value={kpis.conHallazgos} accent="warning" />
        <KpiCard label="Cerradas" value={kpis.cerradas} accent="accent" />
        <KpiCard label="Próximas 30 días" value={kpis.proximas} accent="primary" />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="interna">Internas</TabsTrigger>
          <TabsTrigger value="externa">Externas</TabsTrigger>
        </TabsList>
      </Tabs>

      {!isLoading && auditorias.length === 0 ? (
        <EmptyState title="No hay auditorías programadas" description="Registra la primera del año."
          action={perms.crearAuditoria && <Button onClick={() => setFormOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> Nueva Auditoría</Button>} />
      ) : (
        <DataTable headers={["Código", "Tipo", "Certificación", "Período", "Auditor", "Hallazgos", "Estatus"]} isEmpty={filtered.length === 0} empty="Sin auditorías.">
          {filtered.map((a) => {
            const h = hallazgosCount[a.id];
            return (
              <tr key={a.id} className="cursor-pointer" onClick={() => navigate({ to: "/auditorias/$id", params: { id: a.id } })}>
                <Td><span className="font-mono text-primary">{a.codigo_auditoria}</span></Td>
                <Td>
                  <span className="rounded-md px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: a.tipo === "interna" ? "#3B7DD8" : "#8B5CF6", color: "#fff" }}>
                    {a.tipo === "interna" ? "Interna" : "Externa"}
                  </span>
                </Td>
                <Td className="text-xs uppercase">{a.certificacion ?? "—"}</Td>
                <Td className="whitespace-nowrap text-xs">{a.fecha_inicio ?? "—"} → {a.fecha_fin ?? "—"}</Td>
                <Td className="text-sm">{auditorName(a.auditor_lider_id)}</Td>
                <Td>
                  {h ? (
                    <div className="flex gap-1">
                      {h.mayor > 0 && <OutlineBadge>{h.mayor} Mayor</OutlineBadge>}
                      {h.menor > 0 && <OutlineBadge>{h.menor} Menor</OutlineBadge>}
                      {h.om > 0 && <OutlineBadge>{h.om} OM</OutlineBadge>}
                    </div>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </Td>
                <Td><StatusBadge cfg={AUD_ESTATUS[a.estatus]} /></Td>
              </tr>
            );
          })}
        </DataTable>
      )}

      <AuditoriaFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
