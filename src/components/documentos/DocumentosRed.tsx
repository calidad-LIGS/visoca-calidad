import { useMemo, useCallback, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ReactFlow, Background, Controls, MiniMap,
  type Node, type Edge, MarkerType, useNodesState, useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Network, Sparkles, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DOC_TIPO_LABEL } from "@/lib/badges";
import { DocumentoFicha } from "./DocumentoFicha";
import type { Documento } from "./DocumentoFormDialog";
import { BuscadorIA } from "./BuscadorIA";

// Color representativo por tipo (para la leyenda y el minimapa)
const TIPO_COLOR: Record<string, string> = {
  politica: "#8B5CF6", proceso: "#1BC8A0", manual: "#3B7DD8", formato: "#242736", acta: "#0F1117",
};

const BASE_NODE_STYLE: React.CSSProperties = {
  borderRadius: 8,
  fontSize: 11,
  width: 190,
  padding: 8,
  whiteSpace: "pre-line",
  textAlign: "center",
};

function getNodeStyle(tipo: string): React.CSSProperties {
  const byTipo: Record<string, React.CSSProperties> = {
    politica: { backgroundColor: "#8B5CF6", color: "#fff" },
    proceso: { backgroundColor: "#1BC8A0", color: "#0F1117" },
    manual: { backgroundColor: "#3B7DD8", color: "#fff" },
    formato: { backgroundColor: "#242736", border: "1px solid #2E3347", color: "#E8EAF0" },
    acta: { backgroundColor: "#0F1117", border: "1px solid #555A6B", color: "#8B90A0" },
  };
  return {
    ...BASE_NODE_STYLE,
    ...(byTipo[tipo] ?? { backgroundColor: "#242736", border: "1px solid #2E3347", color: "#E8EAF0" }),
  };
}

interface Rel { documento_origen_id: string; documento_destino_id: string; tipo_relacion: string }

const REL_LABEL: Record<string, string> = {
  padre: "Padre de",
  hijo: "Hijo de",
  sustituye: "Sustituye a",
  sustituto: "Sustituye a",
  sustituido_por: "Sustituido por",
  referencia: "Referencia",
  referencia_mutua: "Mutua",
};

function getEdgeStyle(tipoRelacion: string) {
  if (tipoRelacion === "referencia_mutua") {
    return {
      markerStart: { type: MarkerType.ArrowClosed, color: "#5B9EF0" },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#5B9EF0" },
      style: { stroke: "#5B9EF0", strokeDasharray: "4 2" },
    };
  }
  if (tipoRelacion === "padre" || tipoRelacion === "hijo") {
    return {
      markerEnd: { type: MarkerType.ArrowClosed, color: "#1BC8A0" },
      style: { stroke: "#1BC8A0" },
    };
  }
  // referencia simple
  return {
    markerEnd: { type: MarkerType.ArrowClosed, color: "#8B90A0" },
    style: { stroke: "#8B90A0", strokeDasharray: "4 2" },
  };
}

export function DocumentosRed() {
  const [fichaId, setFichaId] = useState<string | null>(null);
  const [buscador, setBuscador] = useState(false);
  const [cargoSearch, setCargoSearch] = useState("");
  const [cargoSeleccionado, setCargoSeleccionado] = useState<string | null>(null);

  const { data: docs = [] } = useQuery({
    queryKey: ["documentos-red-nodes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("id, empresa_id, tipo, codigo, nombre, area_id, version, fecha_ultima_edicion, estatus, origen, nivel, aplicacion, comentarios, archivo_url, drive_url")
        .eq("estatus", "vigente");
      if (error) throw error;
      return data as Documento[];
    },
  });

  const { data: rels = [] } = useQuery({
    queryKey: ["documentos-red-edges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos_relaciones").select("documento_origen_id, documento_destino_id, tipo_relacion");
      if (error) throw error;
      return data as Rel[];
    },
  });

  const { data: cargos = [] } = useQuery({
    queryKey: ["cargos-red"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cargos")
        .select("id, nombre")
        .eq("activo", true)
        .order("nombre");
      if (error) throw error;
      return data as { id: string; nombre: string }[];
    },
  });

  const { data: docCargos = [] } = useQuery({
    queryKey: ["documentos-cargos-red"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos_cargos")
        .select("documento_id, cargo_id");
      if (error) throw error;
      return data as { documento_id: string; cargo_id: string }[];
    },
  });

  const { initialNodes, initialEdges } = useMemo(() => {
    const docsVisibles = cargoSeleccionado
      ? docs.filter((d) => docCargos.some((dc) => dc.documento_id === d.id && dc.cargo_id === cargoSeleccionado))
      : docs;
    const docIdsVisibles = new Set(docsVisibles.map((d) => d.id));
    const relsVisibles = rels.filter(
      (r) => docIdsVisibles.has(r.documento_origen_id) && docIdsVisibles.has(r.documento_destino_id)
    );

    const nodes: Node[] = docsVisibles.map((d) => {
      const nivelDocs = docsVisibles.filter((x) => x.nivel === d.nivel);
      const nivelIdx = nivelDocs.indexOf(d);
      const xSpacing = Math.max(180, 900 / Math.max(nivelDocs.length, 1));
      return {
        id: d.id,
        type: "default",
        position: {
          x: nivelIdx * xSpacing + xSpacing / 2,
          y: (d.nivel ?? 3) * 130,
        },
        data: {
          label: (
            <div style={{ textAlign: "center", lineHeight: 1.3 }}>
              <div style={{ fontFamily: "monospace", fontSize: 10, opacity: 0.7 }}>{d.codigo}</div>
              <div style={{ fontSize: 11, fontWeight: 600 }}>
                {d.nombre.slice(0, 28)}{d.nombre.length > 28 ? "…" : ""}
              </div>
            </div>
          ),
        },
        style: getNodeStyle(d.tipo),
      };
    });
    const edges: Edge[] = relsVisibles.map((r, i) => ({
      id: `e${i}`,
      source: r.documento_origen_id,
      target: r.documento_destino_id,
      label: REL_LABEL[r.tipo_relacion] ?? r.tipo_relacion,
      labelStyle: { fontSize: 10, fill: "#8B90A0" },
      labelBgStyle: { fill: "#1A1D27", fillOpacity: 0.9 },
      ...getEdgeStyle(r.tipo_relacion),
    }));
    return { initialNodes: nodes, initialEdges: edges };
  }, [docs, rels, cargoSeleccionado, docCargos]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // sync when data loads
  useEffect(() => { setNodes(initialNodes); setEdges(initialEdges); }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((_e: React.MouseEvent, node: Node) => setFichaId(node.id), []);

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <PageHeader
        breadcrumb="Documentos / Red"
        title="Red de Documentos"
        subtitle="Relaciones entre documentos del sistema (M4)"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setBuscador(true)}>
              <Sparkles className="mr-1.5 h-4 w-4 text-primary" /> Búsqueda IA
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/documentos">Volver a lista</Link>
            </Button>
          </>
        }
      />

      {initialNodes.length === 0 ? (
        <EmptyState icon={<Network className="h-10 w-10" />} title="No hay documentos para graficar" />
      ) : initialEdges.length === 0 ? (
        <EmptyState
          icon={<Network className="h-10 w-10" />}
          title="Aún no hay relaciones entre documentos"
          description="Ábrelos desde la Lista Maestra y agrégalas en la ficha del documento."
          action={
            <Button asChild>
              <Link to="/documentos">Ir a Lista Maestra</Link>
            </Button>
          }
        />
      ) : (
        <>
          {cargoSeleccionado ? (
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                Cargo: {cargos.find((c) => c.id === cargoSeleccionado)?.nombre}
              </span>
              <button
                className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => { setCargoSeleccionado(null); setCargoSearch(""); }}
              >
                <X className="h-3 w-3" /> Limpiar
              </button>
            </div>
          ) : (
            <div className="relative mb-3">
              <Input
                value={cargoSearch}
                onChange={(e) => setCargoSearch(e.target.value)}
                placeholder="Buscar cargo para filtrar documentos..."
                className="max-w-sm"
              />
              {cargoSearch && (
                <div className="absolute z-10 mt-1 max-h-48 max-w-sm overflow-auto rounded-md border border-border bg-surface shadow-lg">
                  {cargos
                    .filter((c) => c.nombre.toLowerCase().includes(cargoSearch.toLowerCase()))
                    .map((c) => (
                      <button
                        key={c.id}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-primary/10"
                        onClick={() => { setCargoSeleccionado(c.id); setCargoSearch(""); }}
                      >
                        {c.nombre}
                      </button>
                    ))}
                  {cargos.filter((c) => c.nombre.toLowerCase().includes(cargoSearch.toLowerCase())).length === 0 && (
                    <p className="px-3 py-2 text-xs text-muted-foreground">Sin coincidencias.</p>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {Object.entries(DOC_TIPO_LABEL).map(([tipo, label]) => (
              <span key={tipo} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TIPO_COLOR[tipo] ?? "#2E3347" }} />
                {label}
              </span>
            ))}
          </div>
          <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-0 w-6 border-t-2" style={{ borderColor: "#1BC8A0" }} />
              Padre/Hijo (jerarquía directa)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0 w-6 border-t-2 border-dashed" style={{ borderColor: "#8B90A0" }} />
              Referencia simple (A menciona a B)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0 w-6 border-t-2 border-dashed" style={{ borderColor: "#5B9EF0" }} />
              Referencia mutua (A y B se mencionan) ↔
            </span>
          </div>
          <div className="flex-1 overflow-hidden rounded-lg border border-border">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#2E3347" gap={20} />
              <Controls />
              <MiniMap nodeColor={(n) => (n.style?.backgroundColor as string) ?? "#2E3347"} maskColor="#0F1117cc" />
            </ReactFlow>
          </div>
        </>
      )}

      <DocumentoFicha
        doc={docs.find((d) => d.id === fichaId) ?? null}
        onClose={() => setFichaId(null)}
        onOpenDoc={setFichaId}
      />
      <BuscadorIA open={buscador} onOpenChange={setBuscador} onSelect={setFichaId} />
    </div>
  );
}
