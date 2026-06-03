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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Cargo {
  id: string;
  nombre: string;
  activo: boolean;
}

export function CargosTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cargo | null>(null);
  const [nombre, setNombre] = useState("");

  const { data: cargos = [], isLoading } = useQuery({
    queryKey: ["cargos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cargos")
        .select("id, nombre, activo")
        .order("nombre");
      if (error) throw error;
      return data as Cargo[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase
          .from("cargos")
          .update({ nombre })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cargos").insert({ nombre });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cargos"] });
      toast.success(editing ? "Cargo actualizado" : "Cargo creado");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (c: Cargo) => {
      const { error } = await supabase
        .from("cargos")
        .update({ activo: !c.activo })
        .eq("id", c.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cargos"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditing(null);
    setNombre("");
    setOpen(true);
  };
  const openEdit = (c: Cargo) => {
    setEditing(c);
    setNombre(c.nombre);
    setOpen(true);
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openNew}>
          <Plus className="mr-1.5 h-4 w-4" /> Nuevo cargo
        </Button>
      </div>

      <DataTable
        headers={["Nombre", "Activo", ""]}
        isEmpty={!isLoading && cargos.length === 0}
        empty="No hay cargos registrados."
      >
        {cargos.map((c) => (
          <tr key={c.id}>
            <Td className="font-medium text-foreground">{c.nombre}</Td>
            <Td>
              <Switch checked={c.activo} onCheckedChange={() => toggle.mutate(c)} />
            </Td>
            <Td className="text-right">
              <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </Td>
          </tr>
        ))}
      </DataTable>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar cargo" : "Nuevo cargo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
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
