import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DataTable, Td } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Area {
  id: string;
  nombre: string;
  activo: boolean;
}
interface Empresa {
  id: string;
  nombre: string;
  clave: string;
}
interface AreaEmpresa {
  area_id: string;
  empresa_id: string;
}

export function AreasTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Area | null>(null);
  const [nombre, setNombre] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const { data: areas = [], isLoading } = useQuery({
    queryKey: ["areas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("areas")
        .select("id, nombre, activo")
        .order("nombre");
      if (error) throw error;
      return data as Area[];
    },
  });

  const { data: empresas = [] } = useQuery({
    queryKey: ["empresas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("id, nombre, clave")
        .order("clave");
      if (error) throw error;
      return data as Empresa[];
    },
  });

  const { data: links = [] } = useQuery({
    queryKey: ["area_empresas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("area_empresas")
        .select("area_id, empresa_id");
      if (error) throw error;
      return data as AreaEmpresa[];
    },
  });

  const empresasDeArea = (areaId: string) =>
    links
      .filter((l) => l.area_id === areaId)
      .map((l) => empresas.find((e) => e.id === l.empresa_id))
      .filter(Boolean) as Empresa[];

  const save = useMutation({
    mutationFn: async () => {
      let areaId = editing?.id;
      if (editing) {
        const { error } = await supabase
          .from("areas")
          .update({ nombre })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("areas")
          .insert({ nombre })
          .select("id")
          .single();
        if (error) throw error;
        areaId = data.id;
      }
      // Sync empresa links
      await supabase.from("area_empresas").delete().eq("area_id", areaId!);
      if (selected.length) {
        const { error } = await supabase
          .from("area_empresas")
          .insert(selected.map((empresa_id) => ({ area_id: areaId!, empresa_id })));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["areas"] });
      qc.invalidateQueries({ queryKey: ["area_empresas"] });
      toast.success(editing ? "Área actualizada" : "Área creada");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (a: Area) => {
      const { error } = await supabase
        .from("areas")
        .update({ activo: !a.activo })
        .eq("id", a.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["areas"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditing(null);
    setNombre("");
    setSelected([]);
    setOpen(true);
  };
  const openEdit = (a: Area) => {
    setEditing(a);
    setNombre(a.nombre);
    setSelected(links.filter((l) => l.area_id === a.id).map((l) => l.empresa_id));
    setOpen(true);
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openNew}>
          <Plus className="mr-1.5 h-4 w-4" /> Nueva área
        </Button>
      </div>

      <DataTable
        headers={["Nombre", "Empresas", "Activo", ""]}
        isEmpty={!isLoading && areas.length === 0}
        empty="No hay áreas registradas."
      >
        {areas.map((a) => (
          <tr key={a.id}>
            <Td className="font-medium text-foreground">{a.nombre}</Td>
            <Td>
              <div className="flex flex-wrap gap-1">
                {empresasDeArea(a.id).length === 0 ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : (
                  empresasDeArea(a.id).map((e) => (
                    <span
                      key={e.id}
                      className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary"
                    >
                      {e.clave}
                    </span>
                  ))
                )}
              </div>
            </Td>
            <Td>
              <Switch checked={a.activo} onCheckedChange={() => toggle.mutate(a)} />
            </Td>
            <Td className="text-right">
              <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </Td>
          </tr>
        ))}
      </DataTable>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar área" : "Nueva área"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Empresas asociadas</Label>
              <div className="grid grid-cols-2 gap-2 rounded-md border border-border p-3">
                {empresas.map((e) => (
                  <label
                    key={e.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={selected.includes(e.id)}
                      onCheckedChange={(c) =>
                        setSelected((prev) =>
                          c ? [...prev, e.id] : prev.filter((x) => x !== e.id),
                        )
                      }
                    />
                    {e.nombre}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => save.mutate()}
              disabled={!nombre.trim() || save.isPending}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
