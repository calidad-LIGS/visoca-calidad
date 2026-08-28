import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, X, Plus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { DOC_TIPO_LABEL } from "@/lib/badges";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

interface Colaborador {
  id: string;
  nombre_completo: string;
  usuario: string;
  cargo_id: string | null;
}

interface DocAsignado {
  id: string;
  colaborador_id: string;
  documento_id: string;
  visible: boolean;
  documentos: {
    id: string;
    codigo: string;
    nombre: string;
    tipo: string;
  } | null;
}

interface Documento {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
}

export function ColaboradorDocumentos({
  colaborador,
  onClose,
}: {
  colaborador: Colaborador;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);

  // Documentos asignados al colaborador
  const { data: asignados = [], isLoading } = useQuery({
    queryKey: ["colab-docs", colaborador.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaborador_documentos")
        .select("id, colaborador_id, documento_id, visible, documentos(id, codigo, nombre, tipo)")
        .eq("colaborador_id", colaborador.id)
        .order("documento_id");
      if (error) throw error;
      return (data ?? []) as DocAsignado[];
    },
  });

  // Todos los documentos vigentes (para el dialog de agregar)
  const { data: todosDocumentos = [] } = useQuery({
    queryKey: ["documentos-vigentes-selector"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("id, codigo, nombre, tipo")
        .eq("estatus", "vigente")
        .order("codigo");
      if (error) throw error;
      return (data ?? []) as Documento[];
    },
    staleTime: 60_000,
  });

  // IDs ya asignados
  const asignadosIds = new Set(asignados.map((a) => a.documento_id));

  // Documentos disponibles para agregar (no asignados aún)
  const disponibles = todosDocumentos.filter(
    (d) =>
      !asignadosIds.has(d.id) &&
      (!addSearch ||
        d.codigo.toLowerCase().includes(addSearch.toLowerCase()) ||
        d.nombre.toLowerCase().includes(addSearch.toLowerCase()))
  );

  // Filtrar asignados por búsqueda
  const asignadosFiltrados = search
    ? asignados.filter(
        (a) =>
          a.documentos?.codigo.toLowerCase().includes(search.toLowerCase()) ||
          a.documentos?.nombre.toLowerCase().includes(search.toLowerCase())
      )
    : asignados;

  // Toggle visibilidad
  const toggleVisible = useMutation({
    mutationFn: async (doc: DocAsignado) => {
      const { error } = await supabase
        .from("colaborador_documentos")
        .update({ visible: !doc.visible })
        .eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["colab-docs", colaborador.id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  // Agregar documentos seleccionados
  const agregarDocs = useMutation({
    mutationFn: async () => {
      if (selectedToAdd.length === 0) throw new Error("Selecciona al menos un documento");
      const { error } = await supabase
        .from("colaborador_documentos")
        .insert(
          selectedToAdd.map((documento_id) => ({
            colaborador_id: colaborador.id,
            documento_id,
            visible: true,
          }))
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["colab-docs", colaborador.id] });
      toast.success(`${selectedToAdd.length} documento${selectedToAdd.length > 1 ? "s" : ""} agregado${selectedToAdd.length > 1 ? "s" : ""}`);
      setSelectedToAdd([]);
      setAddOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Quitar documento
  const quitarDoc = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase
        .from("colaborador_documentos")
        .delete()
        .eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["colab-docs", colaborador.id] });
      toast.success("Documento quitado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleAdd = (id: string) => {
    setSelectedToAdd((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display font-semibold text-foreground text-lg">
            {colaborador.nombre_completo}
          </h2>
          <p className="text-xs text-muted-foreground">
            <code className="text-primary">/{colaborador.usuario}</code> · {asignados.length} documentos asignados · {asignados.filter(a => a.visible).length} visibles
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Agregar documentos
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar documento asignado..."
          className="pl-8 h-8 text-sm"
        />
      </div>

      {/* Lista de documentos asignados */}
      <div className="flex-1 overflow-y-auto rounded-lg border border-border">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">Cargando...</div>
        ) : asignadosFiltrados.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {search ? "Sin resultados para tu búsqueda" : "No hay documentos asignados"}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-elevated text-xs uppercase tracking-wider text-muted-foreground sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left">Código</th>
                <th className="px-4 py-2 text-left">Nombre</th>
                <th className="px-4 py-2 text-left">Tipo</th>
                <th className="px-4 py-2 text-center">Visible</th>
                <th className="px-4 py-2 text-center">Quitar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {asignadosFiltrados.map((a) => (
                <tr key={a.id} className={!a.visible ? "opacity-50" : ""}>
                  <td className="px-4 py-2 font-mono text-xs text-primary">
                    {a.documentos?.codigo ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-foreground">
                    {a.documentos?.nombre ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground text-xs">
                    {DOC_TIPO_LABEL[a.documentos?.tipo ?? ""] ?? a.documentos?.tipo ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <Switch
                      checked={a.visible}
                      onCheckedChange={() => toggleVisible.mutate(a)}
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => quitarDoc.mutate(a.id)}
                      className="rounded p-1 text-muted-foreground hover:text-danger hover:bg-danger/10"
                      title="Quitar documento"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Dialog para agregar documentos */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar documentos a {colaborador.nombre_completo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
                placeholder="Buscar por código o nombre..."
                className="pl-8 h-8 text-sm"
              />
            </div>
            <div className="rounded-lg border border-border overflow-y-auto max-h-72">
              {disponibles.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">
                  {addSearch ? "Sin resultados" : "Todos los documentos ya están asignados"}
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-elevated text-xs uppercase tracking-wider text-muted-foreground sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left w-8"></th>
                      <th className="px-3 py-2 text-left">Código</th>
                      <th className="px-3 py-2 text-left">Nombre</th>
                      <th className="px-3 py-2 text-left">Tipo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {disponibles.map((d) => (
                      <tr
                        key={d.id}
                        className="cursor-pointer hover:bg-elevated"
                        onClick={() => toggleAdd(d.id)}
                      >
                        <td className="px-3 py-2">
                          <Checkbox
                            checked={selectedToAdd.includes(d.id)}
                            onCheckedChange={() => toggleAdd(d.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-primary">{d.codigo}</td>
                        <td className="px-3 py-2 text-foreground">{d.nombre}</td>
                        <td className="px-3 py-2 text-muted-foreground text-xs">
                          {DOC_TIPO_LABEL[d.tipo] ?? d.tipo}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {selectedToAdd.length > 0 && (
              <p className="text-xs text-accent">
                {selectedToAdd.length} documento{selectedToAdd.length > 1 ? "s" : ""} seleccionado{selectedToAdd.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setSelectedToAdd([]); }}>
              Cancelar
            </Button>
            <Button
              onClick={() => agregarDocs.mutate()}
              disabled={selectedToAdd.length === 0 || agregarDocs.isPending}
            >
              {agregarDocs.isPending ? "Agregando..." : `Agregar (${selectedToAdd.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
