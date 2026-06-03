import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { Plus, FileDown, Search, Eye, Pencil, Sparkles, Network } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresas, useAreas } from "@/hooks/useCatalogos";
import { usePermisos } from "@/lib/permisos";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Td } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusBadge, OutlineBadge, DOC_ESTATUS, DOC_TIPO_LABEL, APLICACION_LABEL } from "@/lib/badges";
import { DocumentoFormDialog, type Documento } from "./DocumentoFormDialog";
import { DocumentoFicha } from "./DocumentoFicha";
import { BuscadorIA } from "./BuscadorIA";

const PAGE_SIZE = 25;

export function DocumentosView() {
  const perms = usePermisos();
  const { data: empresas = [] } = useEmpresas();
  const { data: areas = [] } = useAreas();

  const [tab, setTab] = useState("vigentes");
  const [search, setSearch] = useState("");
  const [fEmpresa, setFEmpresa] = useState("all");
  const [fArea, setFArea] = useState("all");
  const [fTipo, setFTipo] = useState("all");
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Documento | null>(null);
  const [fichaId, setFichaId] = useState<string | null>(null);
  const [buscadorIA, setBuscadorIA] = useState(false);

  const { data: documentos = [], isLoading } = useQuery({
    queryKey: ["documentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("id, empresa_id, tipo, codigo, nombre, area_id, version, fecha_ultima_edicion, estatus, origen, nivel, aplicacion, comentarios, archivo_url, drive_url")
        .order("codigo");
      if (error) throw error;
      return data as Documento[];
    },
    staleTime: 60_000,
  });

  const empresaName = (id: string | null) => empresas.find((e) => e.id === id)?.nombre ?? "—";
  const areaName = (id: string | null) => areas.find((a) => a.id === id)?.nombre ?? "—";

  const counts = useMemo(() => ({
    vigentes: documentos.filter((d) => d.estatus === "vigente").length,
    todos: documentos.length,
    revision: documentos.filter((d) => d.estatus === "en_revision").length,
    historico: documentos.filter((d) => ["sustituido", "eliminado"].includes(d.estatus)).length,
  }), [documentos]);

  const filtered = useMemo(() => {
    let rows = documentos;
    if (tab === "vigentes") rows = rows.filter((d) => d.estatus === "vigente");
    else if (tab === "revision") rows = rows.filter((d) => d.estatus === "en_revision");
    else if (tab === "historico") rows = rows.filter((d) => ["sustituido", "eliminado"].includes(d.estatus));
    if (fEmpresa !== "all") rows = rows.filter((d) => d.empresa_id === fEmpresa);
    if (fArea !== "all") rows = rows.filter((d) => d.area_id === fArea);
    if (fTipo !== "all") rows = rows.filter((d) => d.tipo === fTipo);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((d) =>
        d.codigo.toLowerCase().includes(q) ||
        d.nombre.toLowerCase().includes(q) ||
        (d.comentarios ?? "").toLowerCase().includes(q));
    }
    return rows;
  }, [documentos, tab, fEmpresa, fArea, fTipo, search]);

  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;

  const exportXLS = () => {
    const rows = filtered.map((d) => ({
      Empresa: empresaName(d.empresa_id),
      Tipo: DOC_TIPO_LABEL[d.tipo] ?? d.tipo,
      Código: d.codigo,
      Nombre: d.nombre,
      Área: areaName(d.area_id),
      Versión: d.version,
      "Ult. Versión (fecha)": d.fecha_ultima_edicion,
      Estatus: DOC_ESTATUS[d.estatus]?.label ?? d.estatus,
      Origen: d.origen,
      Nivel: d.nivel,
      Comentarios: d.comentarios,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Documentos");
    XLSX.writeFile(wb, "control_de_docs.xlsx");
  };

  const fichaDoc = documentos.find((d) => d.id === fichaId) ?? null;

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
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(0); }} className="mb-4">
        <TabsList>
          <TabsTrigger value="vigentes">Vigentes ({counts.vigentes})</TabsTrigger>
          <TabsTrigger value="todos">Todos ({counts.todos})</TabsTrigger>
          <TabsTrigger value="revision">En Revisión ({counts.revision})</TabsTrigger>
          <TabsTrigger value="historico">Histórico ({counts.historico})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterSelect value={fEmpresa} onChange={(v) => { setFEmpresa(v); setPage(0); }} placeholder="Empresa"
          options={empresas.map((e) => ({ value: e.id, label: e.nombre }))} />
        <FilterSelect value={fArea} onChange={(v) => { setFArea(v); setPage(0); }} placeholder="Área"
          options={areas.map((a) => ({ value: a.id, label: a.nombre }))} />
        <FilterSelect value={fTipo} onChange={(v) => { setFTipo(v); setPage(0); }} placeholder="Tipo"
          options={Object.entries(DOC_TIPO_LABEL).map(([value, label]) => ({ value, label }))} />
      </div>

      {!isLoading && documentos.length === 0 ? (
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
            headers={["Empresa", "Tipo", "Código", "Nombre", "Área", "Versión", "Fecha", "Estatus", "Origen", "Nivel", ""]}
            isEmpty={pageRows.length === 0}
            empty="Sin documentos para los filtros aplicados."
          >
            {pageRows.map((d) => (
              <tr key={d.id} className="group">
                <Td>{empresaName(d.empresa_id)}</Td>
                <Td><OutlineBadge>{DOC_TIPO_LABEL[d.tipo] ?? d.tipo}</OutlineBadge></Td>
                <Td><button className="font-mono text-primary hover:underline" onClick={() => setFichaId(d.id)}>{d.codigo}</button></Td>
                <Td className="max-w-[16rem] truncate text-foreground">{d.nombre}</Td>
                <Td>{areaName(d.area_id)}</Td>
                <Td className="font-mono text-xs">{d.version}</Td>
                <Td className="whitespace-nowrap text-xs">{d.fecha_ultima_edicion}</Td>
                <Td><StatusBadge cfg={DOC_ESTATUS[d.estatus]} /></Td>
                <Td className="text-xs">{d.origen}</Td>
                <Td className="text-center">{d.nivel}</Td>
                <Td>
                  <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="icon" onClick={() => setFichaId(d.id)}><Eye className="h-4 w-4" /></Button>
                    {perms.editarDocumento && (
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(d); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </DataTable>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>{filtered.length} documentos</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                <span>{page + 1} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
              </div>
            </div>
          )}
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
