import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEmpresas, useAreas, useUsuarios } from "@/hooks/useCatalogos";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export interface Proyecto {
  id: string;
  nombre: string;
  objetivo: string | null;
  tipo: string | null;
  proceso_perteneciente: string | null;
  empresa_id: string | null;
  area_id: string | null;
  responsable_usuario_id: string | null;
  responsable_nombre: string | null;
  estatus: string;
  alta_prioridad: boolean | null;
  avance_calculado: number | null;
  fecha_inicio_plan: string | null;
  fecha_fin_plan: string | null;
  nota_observacion: string | null;
}

const TIPO_OPTS = [
  { value: "implementacion", label: "Implementación" },
  { value: "mejora", label: "Mejora" },
  { value: "documental", label: "Documental" },
  { value: "auditoria", label: "Auditoría" },
  { value: "otro", label: "Otro" },
];

export function ProyectoFormDialog({
  open, onOpenChange, editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Proyecto | null;
}) {
  const qc = useQueryClient();
  const { perfil } = useAuth();
  const { data: empresas = [] } = useEmpresas();
  const { data: areas = [] } = useAreas();
  const { data: usuarios = [] } = useUsuarios();

  const [nombre, setNombre] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [tipo, setTipo] = useState("implementacion");
  const [proceso, setProceso] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [area, setArea] = useState("");
  const [responsable, setResponsable] = useState("");
  const [estatus, setEstatus] = useState("pendiente");
  const [altaPrioridad, setAltaPrioridad] = useState(false);
  const [fInicio, setFInicio] = useState("");
  const [fFin, setFFin] = useState("");
  const [nota, setNota] = useState("");

  useEffect(() => {
    if (!open) return;
    setNombre(editing?.nombre ?? "");
    setObjetivo(editing?.objetivo ?? "");
    setTipo(editing?.tipo ?? "implementacion");
    setProceso(editing?.proceso_perteneciente ?? "");
    setEmpresa(editing?.empresa_id ?? "");
    setArea(editing?.area_id ?? "");
    setResponsable(editing?.responsable_usuario_id ?? "");
    setEstatus(editing?.estatus ?? "pendiente");
    setAltaPrioridad(editing?.alta_prioridad ?? false);
    setFInicio(editing?.fecha_inicio_plan ?? "");
    setFFin(editing?.fecha_fin_plan ?? "");
    setNota(editing?.nota_observacion ?? "");
  }, [open, editing]);

  const save = useMutation({
    mutationFn: async () => {
      const respNombre = usuarios.find((u) => u.id === responsable)?.nombre_completo ?? null;
      const payload = {
        nombre,
        objetivo: objetivo || null,
        tipo,
        proceso_perteneciente: proceso || null,
        empresa_id: empresa || null,
        area_id: area || null,
        responsable_usuario_id: responsable || null,
        responsable_nombre: respNombre,
        estatus,
        alta_prioridad: altaPrioridad,
        fecha_inicio_plan: fInicio || null,
        fecha_fin_plan: fFin || null,
        nota_observacion: nota || null,
      };
      if (editing) {
        const { error } = await supabase.from("proyectos").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("proyectos")
          .insert({ ...payload, creado_por: perfil?.id ?? null });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proyectos"] });
      toast.success(editing ? "Proyecto actualizado" : "Proyecto creado");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar proyecto" : "Nuevo proyecto"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
          <F label="Nombre" full>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del proyecto" />
          </F>
          <F label="Objetivo" full>
            <Textarea value={objetivo} onChange={(e) => setObjetivo(e.target.value)} />
          </F>
          <F label="Tipo">
            <Sel value={tipo} onChange={setTipo} options={TIPO_OPTS} />
          </F>
          <F label="Proceso perteneciente">
            <Input value={proceso} onChange={(e) => setProceso(e.target.value)} placeholder="Proceso / área funcional" />
          </F>
          <F label="Empresa">
            <Sel value={empresa} onChange={setEmpresa} options={empresas.map((e) => ({ value: e.id, label: e.nombre }))} />
          </F>
          <F label="Área">
            <Sel value={area} onChange={setArea} options={areas.map((a) => ({ value: a.id, label: a.nombre }))} />
          </F>
          <F label="Responsable">
            <Sel value={responsable} onChange={setResponsable} options={usuarios.map((u) => ({ value: u.id, label: u.nombre_completo }))} />
          </F>
          <F label="Estatus">
            <Sel value={estatus} onChange={setEstatus} options={[
              { value: "pendiente", label: "Pendiente" },
              { value: "en_proceso", label: "En proceso" },
              { value: "finalizado", label: "Finalizado" },
              { value: "cancelado", label: "Cancelado" },
            ]} />
          </F>
          <F label="Inicio (plan)">
            <Input type="date" value={fInicio} onChange={(e) => setFInicio(e.target.value)} />
          </F>
          <F label="Fin (plan)">
            <Input type="date" value={fFin} onChange={(e) => setFFin(e.target.value)} />
          </F>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 sm:col-span-2">
            <div>
              <Label className="text-sm">Alta prioridad</Label>
              <p className="text-xs text-muted-foreground">Aparecerá en el monitor del tablero.</p>
            </div>
            <Switch checked={altaPrioridad} onCheckedChange={setAltaPrioridad} />
          </div>
          <F label="Notas / observaciones" full>
            <Textarea value={nota} onChange={(e) => setNota(e.target.value)} />
          </F>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={!nombre.trim() || save.isPending}>
            {save.isPending ? "Guardando…" : editing ? "Guardar cambios" : "Crear proyecto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function F({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Sel({
  value, onChange, options, placeholder = "Selecciona…",
}: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
      </SelectContent>
    </Select>
  );
}
