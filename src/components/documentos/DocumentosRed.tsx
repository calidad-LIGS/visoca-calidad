import { useMemo, useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ReactFlow, Background, Controls, MiniMap,
  type Node, type Edge, MarkerType, useNodesState, useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Network, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { DOC_TIPO_LABEL } from "@/lib/badges";
import { DocumentoFicha } from "./DocumentoFicha";
import type { Documento } from "./DocumentoFormDialog";
import { BuscadorIA } from "./BuscadorIA";

const TIPO_COLOR: Record<string, string> = {
  politica: "#3B7DD8", proceso: "#1BC8A0", manual: "#8B5CF6", formato: "#F5A623", acta: "#E54B4B",
};

interface Rel { documento_origen_id: string; documento_destino_id: string; tipo_relacion: string }

export function DocumentosRed() {
  const [fichaId, setFichaId] = useState<string | null>(null);
  const [buscador, setBuscador] = useState(false);

  const { data: docs = [] } = useQuery({
    queryKey: ["documentos-red-nodes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos").select("id, codigo, nombre, tipo").neq("estatus", "eliminado");
      if (error) throw error;
      return data as DocNode[];
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

  const { initialNodes, initialEdges } = useMemo(() => {
    const cols = Math.max(1, Math.ceil(Math.sqrt(docs.length)));
    const nodes: Node[] = docs.map((d, i) => ({
      id: d.id,
      position: { x: (i % cols) * 220, y: Math.floor(i / cols) * 130 },
      data: { label: `${d.codigo}\n${d.nombre.slice(0, 28)}` },
      style: {
        background: "#1A1D27",
        border: `2px solid ${TIPO_COLOR[d.tipo] ?? "#2E3347"}`,
        borderRadius: 8,
        color: "#E6E8EE",
        fontSize: 11,
        width: 190,
        padding: 8,
        whiteSpace: "pre-line" as const,
        textAlign: "center" as const,
      },
    }));
    const edges: Edge[] = rels.map((r, i) => ({
      id: `e${i}`,
      source: r.documento_origen_id,
      target: r.documento_destino_id,
      label: r.tipo_relacion,
      labelStyle: { fill: "#8B90A0", fontSize: 9 },
      style: { stroke: "#2E3347" },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#555A6B" },
    }));
    return { initialNodes: nodes, initialEdges: edges };
  }, [docs, rels]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // sync when data loads
  useMemo(() => { setNodes(initialNodes); }, [initialNodes, setNodes]);

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

      {docs.length === 0 ? (
        <EmptyState icon={<Network className="h-10 w-10" />} title="No hay documentos para graficar" />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {Object.entries(DOC_TIPO_LABEL).map(([tipo, label]) => (
              <span key={tipo} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TIPO_COLOR[tipo] ?? "#2E3347" }} />
                {label}
              </span>
            ))}
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
              <MiniMap nodeColor={(n) => (n.style?.borderColor as string) ?? "#2E3347"} maskColor="#0F1117cc" />
            </ReactFlow>
          </div>
        </>
      )}

      <DocumentoFicha
        doc={docs.find((d) => d.id === fichaId) ? (docs.find((d) => d.id === fichaId) as never) : null}
        onClose={() => setFichaId(null)}
        onOpenDoc={setFichaId}
      />
      <BuscadorIA open={buscador} onOpenChange={setBuscador} onSelect={setFichaId} />
    </div>
  );
}
