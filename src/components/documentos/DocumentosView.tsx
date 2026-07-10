import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Plus, FileDown, Search, Eye, Pencil, Sparkles, Network, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresas, useAreas, useCargos } from "@/hooks/useCatalogos";
import { usePermisos } from "@/lib/permisos";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Td, Tr } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, OutlineBadge, DOC_ESTATUS, DOC_TIPO_LABEL } from "@/lib/badges";
import { DocumentoFormDialog, type Documento } from "./DocumentoFormDialog";
import { DocumentoFicha } from "./DocumentoFicha";
import { BuscadorIA } from "./BuscadorIA";

const PAGE_SIZE = 25;
const DOC_COLS = "id, empresa_id, tipo, codigo, nombre, area_id, version, fecha_ultima_edicion, estatus, origen, nivel, aplicacion, aplicacion_arr, comentarios, archivo_url, drive_url";


export function DocumentosView() {
  const perms = usePermisos();
  const { data: empresas = [] } = useEmpresas();
  const { data: areas = [] } = useAreas();
  const { data: cargos = [] } = useCargos();

  const [tab, setTab] = useState("vigentes");
  const [search, setSearch] = useState("");
  const [fEmpresa, setFEmpresa] = useState("all");
  const [fArea, setFArea] = useState("all");
  const [fTipo, setFTipo] = useState("all");
  const [fCargo, setFCargo] = useState("all");
  const [cargoBusq, setCargoBusq] = useState("");
  const [cargoOpen, setCargoOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Documento | null>(null);
  const [fichaId, setFichaId] = useState<string | null>(null);
  const [buscadorIA, setBuscadorIA] = useState(false);

  // IDs de documentos asignados al cargo seleccionado
  const { data: cargoDocIds } = useQuery({
    queryKey: ["documentos-cargo-ids", fCargo],
    enabled: fCargo !== "all",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos_cargos")
        .select("documento_id")
        .eq("cargo_id", fCargo);
      if (error) throw error;
      return (data as { documento_id: string }[]).map((r) => r.documento_id);
    },
    staleTime: 60_000,
  });

  // Reset de página al cambiar filtros
  useEffect(() => { setPage(0); }, [tab, fEmpresa, fArea, fTipo, fCargo, search]);

  // Tabla paginada (server-side)
  const { data: documentos = [], isLoading } = useQuery({
    queryKey: ["documentos", tab, fEmpresa, fArea, fTipo, fCargo, cargoDocIds, search, page],
    enabled: fCargo === "all" || cargoDocIds !== undefined,
    queryFn: async () => {
      let q = supabase.from("documentos").select(DOC_COLS);
      if (tab === "vigentes") q = q.eq("estatus", "vigente");
      else if (tab === "historico") q = q.in("estatus", ["sustituido", "eliminado"]);
      if (fEmpresa !== "all") q = q.eq("empresa_id", fEmpresa);
      if (fArea !== "all") q = q.eq("area_id", fArea);
      if (fTipo !== "all") q = q.eq("tipo", fTipo);
      if (fCargo !== "all") q = q.in("id", cargoDocIds?.length ? cargoDocIds : ["00000000-0000-0000-0000-000000000000"]);
      const s = search.trim();
      if (s) {
        const safe = s.replace(/[%,()]/g, " ");
        q = q.or(`codigo.ilike.%${safe}%,nombre.ilike.%${safe}%,comentarios.ilike.%${safe}%`);
      }
      const { data, error } = await q
        .order("codigo")
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (error) throw error;
      return data as Documento[];
    },
    staleTime: 60_000,
  });

  // Conteo total para la paginación (mismos filtros)
  const { data: total = 0 } = useQuery({
    queryKey: ["documentos-count", tab, fEmpresa, fArea, fTipo, fCargo, cargoDocIds, search],
    enabled: fCargo === "all" || cargoDocIds !== undefined,
    queryFn: async () => {
      let q = supabase.from("documentos").select("*", { count: "exact", head: true });
      if (tab === "vigentes") q = q.eq("estatus", "vigente");
      else if (tab === "historico") q = q.in("estatus", ["sustituido", "eliminado"]);
      if (fEmpresa !== "all") q = q.eq("empresa_id", fEmpresa);
      if (fArea !== "all") q = q.eq("area_id", fArea);
      if (fTipo !== "all") q = q.eq("tipo", fTipo);
      if (fCargo !== "all") q = q.in("id", cargoDocIds?.length ? cargoDocIds : ["00000000-0000-0000-0000-000000000000"]);
      const s = search.trim();
      if (s) {
        const safe = s.replace(/[%,()]/g, " ");
        q = q.or(`codigo.ilike.%${safe}%,nombre.ilike.%${safe}%,comentarios.ilike.%${safe}%`);
      }
      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 60_000,
  });

  // Conteos de pestañas sobre el total (sin filtros adicionales)
  const { data: estatusRows = [] } = useQuery({
    queryKey: ["documentos-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("documentos").select("estatus");
      if (error) throw error;
      return data as { estatus: string }[];
    },
    staleTime: 60_000,
  });

  // Documento abierto en ficha (puede no estar en la página actual)
  const { data: fichaDoc = null } = useQuery({
    queryKey: ["documento-ficha", fichaId],
    enabled: !!fichaId,
    queryFn: async () => {
      const { data, error } = await supabase.from("documentos").select(DOC_COLS).eq("id", fichaId!).single();
      if (error) throw error;
      return data as Documento;
    },
  });

  const empresaName = (id: string | null) => empresas.find((e) => e.id === id)?.nombre ?? "—";
  const areaName = (id: string | null) => areas.find((a) => a.id === id)?.nombre ?? "—";

  const counts = useMemo(() => ({
    vigentes: estatusRows.filter((d) => d.estatus === "vigente").length,
    todos: estatusRows.length,
    historico: estatusRows.filter((d) => ["sustituido", "eliminado"].includes(d.estatus)).length,
  }), [estatusRows]);

  // Exporta TODOS los registros filtrados (sin paginar)
  const exportXLS = async () => {
    let q = supabase.from("documentos").select(DOC_COLS);
    if (tab === "vigentes") q = q.eq("estatus", "vigente");
    else if (tab === "historico") q = q.in("estatus", ["sustituido", "eliminado"]);
    if (fEmpresa !== "all") q = q.eq("empresa_id", fEmpresa);
    if (fArea !== "all") q = q.eq("area_id", fArea);
    if (fTipo !== "all") q = q.eq("tipo", fTipo);
    if (fCargo !== "all") q = q.in("id", cargoDocIds?.length ? cargoDocIds : ["00000000-0000-0000-0000-000000000000"]);
    const s = search.trim();
    if (s) {
      const safe = s.replace(/[%,()]/g, " ");
      q = q.or(`codigo.ilike.%${safe}%,nombre.ilike.%${safe}%,comentarios.ilike.%${safe}%`);
    }
    const { data, error } = await q.order("codigo");
    if (error || !data) {
      toast.error("No se pudo exportar los documentos.");
      return;
    }
    const rows = (data as Documento[]).map((d) => ({
      Empresa: empresaName(d.empresa_id),
      Tipo: DOC_TIPO_LABEL[d.tipo] ?? d.tipo,
      Código: d.codigo,
      Nombre: d.nombre,
      Área: areaName(d.area_id),
      Versión: d.version,
      "Ult. Versión (fecha)": d.fecha_ultima_edicion,
      Estatus: DOC_ESTATUS[d.estatus]?.label ?? d.estatus,
      Nivel: d.nivel,
      Comentarios: d.comentarios,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Documentos");
    XLSX.writeFile(wb, "control_de_docs.xlsx");
  };

  return (
    <div>
      <PageHeader
        breadcrumb="Documentos"
        title="Control de Documentos"
        subtitle="Lista Maestra"
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/documentos/red"><Network className="mr-1.5 h-4 w-4" /> Vista de Red</Link>
            </Button>
            {perms.exportar && (
              <Button variant="outline" size="sm" onClick={exportXLS}>
                <FileDown className="mr-1.5 h-4 w-4" /> Exportar XLS
              </Button>
            )}
            {perms.crearDocumento && (
              <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
                <Plus className="mr-1.5 h-4 w-4" /> Nuevo Documento
              </Button>
            )}
          </>
        }
      />

      {/* Búsqueda IA + búsqueda textual */}
      <div className="mb-4 flex gap-2">
        <Button variant="outline" onClick={() => setBuscadorIA(true)} className="shrink-0">
          <Sparkles className="mr-1.5 h-4 w-4 text-primary" /> Búsqueda IA
        </Button>
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search className="h-4 w-4" />
          </span>
          <Input
            className="pl-9"
            placeholder="Filtra por código, nombre o comentario…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="vigentes">Vigentes ({counts.vigentes})</TabsTrigger>
          <TabsTrigger value="todos">Todos ({counts.todos})</TabsTrigger>
          <TabsTrigger value="historico">Histórico ({counts.historico})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterSelect value={fEmpresa} onChange={setFEmpresa} placeholder="Empresa"
          options={empresas.map((e) => ({ value: e.id, label: e.nombre }))} />
        <FilterSelect value={fArea} onChange={setFArea} placeholder="Área"
          options={areas.map((a) => ({ value: a.id, label: a.nombre }))} />
        <FilterSelect value={fTipo} onChange={setFTipo} placeholder="Tipo"
          options={Object.entries(DOC_TIPO_LABEL).map(([value, label]) => ({ value, label }))} />
        <div className="relative">
          {fCargo !== "all" ? (
            <button
              onClick={() => setFCargo("all")}
              className="flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm text-primary"
            >
              {cargos.find((c) => c.id === fCargo)?.nombre ?? "Cargo"}
              <X className="h-3 w-3" />
            </button>
          ) : (
            <>
              <Input
                value={cargoBusq}
                onChange={(e) => { setCargoBusq(e.target.value); setCargoOpen(true); }}
                onFocus={() => setCargoOpen(true)}
                onBlur={() => setTimeout(() => setCargoOpen(false), 150)}
                placeholder="Filtrar por cargo..."
                className="h-9 w-52 text-sm"
              />
              {cargoOpen && cargoBusq && (
                <div
                  className="absolute left-0 top-full z-30 mt-1 w-52 overflow-auto rounded-md border border-border shadow-xl"
                  style={{ backgroundColor: "#1A1D27", maxHeight: "200px" }}
                >
                  {cargos
                    .filter((c) => c.activo && c.nombre.toLowerCase().includes(cargoBusq.toLowerCase()))
                    .map((c) => (
                      <button
                        key={c.id}
                        onMouseDown={() => { setFCargo(c.id); setCargoBusq(""); setCargoOpen(false); }}
                        className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-primary/10"
                      >
                        {c.nombre}
                      </button>
                    ))}
                  {cargos.filter((c) => c.activo && c.nombre.toLowerCase().includes(cargoBusq.toLowerCase())).length === 0 && (
                    <p className="px-3 py-2 text-xs text-muted-foreground">Sin coincidencias</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mb-4">
        {(fEmpresa !== "all" || fArea !== "all" || fTipo !== "all" || fCargo !== "all" || search.trim() !== "") ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{total} resultados</span>
            <button
              onClick={() => { setFEmpresa("all"); setFArea("all"); setFTipo("all"); setFCargo("all"); setSearch(""); setPage(0); setCargoBusq(""); setCargoOpen(false); }}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <X className="h-3 w-3" /> Limpiar filtros
            </button>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">{total} registros</span>
        )}
      </div>

      {!isLoading && estatusRows.length === 0 ? (
        <EmptyState
          icon={<Search className="h-10 w-10" />}
          title="No hay documentos registrados"
          description="Comienza importando tu lista maestra."
          action={perms.crearDocumento && (
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="mr-1.5 h-4 w-4" /> Nuevo Documento
            </Button>
          )}
        />
      ) : (
        <>
          <DataTable
            headers={["Empresa", "Tipo", "Código", "Nombre", "Área", "Versión", "Fecha", "Estatus", "Nivel", ""]}
            isLoading={isLoading}
            isEmpty={documentos.length === 0}
            empty="Sin documentos para los filtros aplicados."
          >
            {documentos.map((d) => (
              <Tr key={d.id} active={fichaId === d.id} className="group">
                <Td>{empresaName(d.empresa_id)}</Td>
                <Td><OutlineBadge>{DOC_TIPO_LABEL[d.tipo] ?? d.tipo}</OutlineBadge></Td>
                <Td><button className="font-mono text-primary hover:underline" onClick={() => setFichaId(d.id)}>{d.codigo}</button></Td>
                <Td className="max-w-[16rem] truncate text-foreground">{d.nombre}</Td>
                <Td>{areaName(d.area_id)}</Td>
                <Td className="font-mono text-xs">{d.version}</Td>
                <Td className="whitespace-nowrap text-xs">{d.fecha_ultima_edicion}</Td>
                <Td><StatusBadge cfg={DOC_ESTATUS[d.estatus]} /></Td>
                <Td className="text-center">{d.nivel ? `N${d.nivel}` : "—"}</Td>
                <Td>
                  <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="icon" aria-label="Ver detalles" onClick={() => setFichaId(d.id)}><Eye className="h-4 w-4" /></Button>
                    {perms.editarDocumento && (
                      <Button variant="ghost" size="icon" aria-label="Editar documento" onClick={() => { setEditing(d); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </DataTable>

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} noun="documentos" />
        </>
      )}

      <DocumentoFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} />
      <DocumentoFicha doc={fichaDoc} onClose={() => setFichaId(null)} onOpenDoc={setFichaId} />
      <BuscadorIA open={buscadorIA} onOpenChange={setBuscadorIA} onSelect={setFichaId} />
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
