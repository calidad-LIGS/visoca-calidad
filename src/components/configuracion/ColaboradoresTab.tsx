import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Copy, Check, Pencil, Users, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { crearColaborador } from "@/lib/colaborador.functions";
import { useServerFn } from "@tanstack/react-start";
import { ColaboradorDocumentos } from "@/components/colaboradores/ColaboradorDocumentos";
import { useEmpresas, useCargos } from "@/hooks/useCatalogos";
import { DataTable, Td } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Colaborador {
  id: string;
  nombre_completo: string;
  usuario: string;
  empresa_id: string | null;
  cargo_id: string | null;
  activo: boolean;
}

function generarUsuario(nombre: string): string {
  const partes = nombre.trim().split(" ").filter(Boolean);
  if (partes.length < 2) return nombre.toLowerCase().replace(/\s/g, "");
  const inicial = partes[0][0].toLowerCase();
  const apellido = partes[1].toLowerCase().replace(/[^a-z]/g, "");
  return `${inicial}${apellido}`;
}

function buildUrl(usuario: string): string {
  return `${window.location.origin}/colaborador/${usuario}`;
}

export function ColaboradoresTab() {
  const qc = useQueryClient();
  const crearColab = useServerFn(crearColaborador);
  const { data: empresas = [] } = useEmpresas();
  const { data: cargos = [] } = useCargos();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [empresaId, setEmpresaId] = useState("");
  const [cargoId, setCargoId] = useState("");
  const [usuario, setUsuario] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [configColaborador, setConfigColaborador] = useState<Colaborador | null>(null);

  const { data: colaboradores = [], isLoading } = useQuery({
    queryKey: ["colaboradores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores")
        .select("id, nombre_completo, usuario, empresa_id, cargo_id, activo")
        .order("nombre_completo");
      if (error) throw error;
      return data as Colaborador[];
    },
  });

  const handleNombreChange = (v: string) => {
    setNombre(v);
    if (!editingId) setUsuario(generarUsuario(v));
  };

  const copyUrl = (col: Colaborador) => {
    navigator.clipboard.writeText(buildUrl(col.usuario));
    setCopiedId(col.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openNew = () => {
    setEditingId(null);
    setNombre("");
    setEmpresaId("");
    setCargoId("");
    setUsuario("");
    setOpen(true);
  };

  const openEdit = (c: Colaborador) => {
    setEditingId(c.id);
    setNombre(c.nombre_completo);
    setEmpresaId(c.empresa_id ?? "");
    setCargoId(c.cargo_id ?? "");
    setUsuario(c.usuario);
    setOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!nombre.trim()) throw new Error("El nombre es requerido");
      if (!usuario.trim()) throw new Error("El usuario es requerido");

      if (editingId) {
        const { error } = await supabase
          .from("colaboradores")
          .update({
            nombre_completo: nombre.trim(),
            empresa_id: empresaId || null,
            cargo_id: cargoId || null,
            usuario: usuario.trim().toLowerCase(),
          })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const result = await crearColab({
          data: {
            nombre_completo: nombre.trim(),
            empresa_id: empresaId || null,
            cargo_id: cargoId || null,
            usuario: usuario.trim().toLowerCase(),
          },
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success(editingId ? "Colaborador actualizado" : "Colaborador creado");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (c: Colaborador) => {
      const { error } = await supabase
        .from("colaboradores")
        .update({ activo: !c.activo })
        .eq("id", c.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["colaboradores"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const empresaNombre = (id: string | null) => empresas.find((e) => e.id === id)?.nombre ?? "—";
  const cargoNombre = (id: string | null) => cargos.find((c) => c.id === id)?.nombre ?? "—";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Los colaboradores acceden a sus documentos en: <code className="text-primary">/colaborador/[usuario]</code>
        </p>
        <Button onClick={openNew}>
          <Plus className="mr-1.5 h-4 w-4" /> Nuevo colaborador
        </Button>
      </div>

      <DataTable
        headers={["Nombre", "Usuario", "Empresa", "Cargo", "URL de acceso", "Activo", ""]}
        isEmpty={!isLoading && colaboradores.length === 0}
        empty="No hay colaboradores registrados."
        isLoading={isLoading}
      >
        {colaboradores.map((c) => (
          <tr key={c.id}>
            <Td className="font-medium text-foreground">{c.nombre_completo}</Td>
            <Td><code className="text-xs text-primary">{c.usuario}</code></Td>
            <Td className="text-sm text-muted-foreground">{empresaNombre(c.empresa_id)}</Td>
            <Td className="text-sm text-muted-foreground">{cargoNombre(c.cargo_id)}</Td>
            <Td>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 text-xs"
                onClick={() => copyUrl(c)}
              >
                {copiedId === c.id ? (
                  <><Check className="h-3 w-3 text-accent" /> Copiado</>
                ) : (
                  <><Copy className="h-3 w-3" /> Copiar URL</>
                )}
              </Button>
            </Td>
            <Td>
              <Switch checked={c.activo} onCheckedChange={() => toggle.mutate(c)} />
            </Td>
            <Td className="text-right">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setConfigColaborador(c)}
                title="Configurar documentos"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </Td>
          </tr>
        ))}
      </DataTable>

      <Dialog open={open} onOpenChange={(v) => { if (!v) setOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar colaborador" : "Nuevo colaborador"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre completo</Label>
              <Input
                value={nombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                placeholder="Ej: Juan Pérez García"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Usuario generado</Label>
              <div className="flex gap-2">
                <Input
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value.toLowerCase().replace(/\s/g, ""))}
                  placeholder="jperez"
                  className="font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                URL de acceso: <span className="text-primary">/colaborador/{usuario || "usuario"}</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Empresa</Label>
                <Select value={empresaId} onValueChange={setEmpresaId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {empresas.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Cargo</Label>
                <Select value={cargoId} onValueChange={setCargoId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {cargos.filter((c) => c.activo).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => save.mutate()} disabled={!nombre.trim() || !usuario.trim() || save.isPending}>
              {save.isPending ? "Guardando..." : editingId ? "Guardar cambios" : "Crear colaborador"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {configColaborador && (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setConfigColaborador(null)}
          />
          <div className="relative z-10 flex h-screen w-full max-w-3xl flex-col bg-background border-l border-border p-6 shadow-2xl overflow-y-auto">
            <ColaboradorDocumentos
              colaborador={configColaborador}
              onClose={() => setConfigColaborador(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
