import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, FileText, ExternalLink, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DOC_TIPO_LABEL, DOC_ESTATUS } from "@/lib/badges";
import { StatusBadge } from "@/lib/badges";

export const Route = createFileRoute("/colaborador/$usuario")({
  component: ColaboradorPortal,
});

function ColaboradorPortal() {
  const { usuario } = Route.useParams();
  const [search, setSearch] = useState("");

  // 1. Buscar el colaborador por usuario
  const { data: colaborador, isLoading: loadingColab } = useQuery({
    queryKey: ["colaborador-portal", usuario],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores")
        .select("id, nombre_completo, usuario, activo")
        .eq("usuario", usuario)
        .eq("activo", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // 2. Cargar documentos visibles para este colaborador
  const { data: documentos = [], isLoading: loadingDocs } = useQuery({
    queryKey: ["colaborador-documentos", colaborador?.id],
    enabled: !!colaborador?.id,
    queryFn: async () => {
      // Step 1: get visible documento_ids for this colaborador
      const { data: links, error: linksError } = await supabase
        .from("colaborador_documentos")
        .select("documento_id")
        .eq("colaborador_id", colaborador!.id)
        .eq("visible", true);
      if (linksError) throw linksError;
      if (!links || links.length === 0) return [];

      const ids = links.map((l) => l.documento_id);

      // Step 2: fetch the actual documentos
      const { data: docs, error: docsError } = await supabase
        .from("documentos")
        .select("id, codigo, nombre, tipo, nivel, version, fecha_ultima_edicion, estatus, archivo_url, drive_url")
        .in("id", ids)
        .eq("estatus", "vigente")
        .order("codigo");
      if (docsError) throw docsError;
      return (docs ?? []) as Array<{
        id: string;
        codigo: string;
        nombre: string;
        tipo: string;
        nivel: number | null;
        version: string | null;
        fecha_ultima_edicion: string | null;
        estatus: string;
        archivo_url: string | null;
        drive_url: string | null;
      }>;
    },
  });

  const docsFiltrados = search.trim()
    ? documentos.filter(
        (d) =>
          d.codigo.toLowerCase().includes(search.toLowerCase()) ||
          d.nombre.toLowerCase().includes(search.toLowerCase()) ||
          (DOC_TIPO_LABEL[d.tipo] ?? d.tipo).toLowerCase().includes(search.toLowerCase())
      )
    : documentos;

  // Estado: cargando
  if (loadingColab) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  // Estado: colaborador no encontrado o inactivo
  if (!colaborador) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">Portal no disponible</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          El usuario <span className="font-mono text-primary">/{usuario}</span> no existe o no está activo.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div>
            <h1 className="font-display text-lg font-bold text-primary">VISOCA — Documentos</h1>
            <p className="text-sm text-muted-foreground">
              Bienvenido, <span className="font-medium text-foreground">{colaborador.nombre_completo}</span>
            </p>
          </div>
          <Badge variant="outline" className="text-xs">Solo lectura</Badge>
        </div>
      </div>

      {/* Contenido */}
      <div className="mx-auto max-w-5xl px-6 py-6">
        {/* Buscador */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, nombre o tipo..."
            className="pl-9"
          />
        </div>

        {/* Tabla de documentos */}
        {loadingDocs ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 w-full rounded-md bg-elevated animate-pulse" />
            ))}
          </div>
        ) : docsFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-foreground">
              {search ? "Sin resultados" : "No hay documentos asignados"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search ? "Intenta con otro término de búsqueda." : "Contacta a tu área de Calidad para más información."}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-elevated text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Código</th>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Nivel</th>
                  <th className="px-4 py-3 text-left">Versión</th>
                  <th className="px-4 py-3 text-left">Estatus</th>
                  <th className="px-4 py-3 text-center">Acceso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {docsFiltrados.map((d) => (
                  <tr key={d.id} className="hover:bg-elevated/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-primary">{d.codigo}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{d.nombre}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {DOC_TIPO_LABEL[d.tipo] ?? d.tipo}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d.nivel ? `N${d.nivel}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{d.version ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge cfg={DOC_ESTATUS[d.estatus]} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {d.archivo_url && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" asChild>
                            <a href={d.archivo_url} target="_blank" rel="noopener noreferrer" title="Ver PDF">
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                        {d.drive_url && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" asChild>
                            <a href={d.drive_url} target="_blank" rel="noopener noreferrer" title="Abrir en Drive">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                        {!d.archivo_url && !d.drive_url && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-border bg-elevated/30 px-4 py-2 text-xs text-muted-foreground">
              {docsFiltrados.length} documento{docsFiltrados.length !== 1 ? "s" : ""}
              {search && ` · filtrando por "${search}"`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
