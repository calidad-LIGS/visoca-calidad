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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Empresa {
  id: string;
  nombre: string;
  clave: string;
  activo: boolean;
}

const CLAVES = ["GAP", "LIGS", "TV", "CORP", "OTRA"];

export function EmpresasTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Empresa | null>(null);
  const [nombre, setNombre] = useState("");
  const [clave, setClave] = useState("OTRA");

  const { data: empresas = [], isLoading } = useQuery({
    queryKey: ["empresas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("id, nombre, clave, activo")
        .order("nombre");
      if (error) throw error;
      return data as Empresa[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase
          .from("empresas")
          .update({ nombre, clave })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("empresas")
          .insert({ nombre, clave });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["empresas"] });
      toast.success(editing ? "Empresa actualizada" : "Empresa creada");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (e: Empresa) => {
      const { error } = await supabase
        .from("empresas")
        .update({ activo: !e.activo })
        .eq("id", e.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["empresas"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditing(null);
    setNombre("");
    setClave("OTRA");
    setOpen(true);
  };
  const openEdit = (e: Empresa) => {
    setEditing(e);
    setNombre(e.nombre);
    setClave(e.clave);
    setOpen(true);
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openNew}>
          <Plus className="mr-1.5 h-4 w-4" /> Nueva empresa
        </Button>
      </div>

      <DataTable
        headers={["Nombre", "Clave", "Activo", ""]}
        isEmpty={!isLoading && empresas.length === 0}
        empty="No hay empresas registradas."
      >
        {empresas.map((e) => (
          <tr key={e.id}>
            <Td className="font-medium text-foreground">{e.nombre}</Td>
            <Td>
              <span className="rounded-md border border-border px-2 py-0.5 font-mono text-xs">
                {e.clave}
              </span>
            </Td>
            <Td>
              <Switch
                checked={e.activo}
                onCheckedChange={() => toggle.mutate(e)}
              />
            </Td>
            <Td className="text-right">
              <Button variant="ghost" size="icon" onClick={() => openEdit(e)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </Td>
          </tr>
        ))}
      </DataTable>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar empresa" : "Nueva empresa"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Clave</Label>
              <Select value={clave} onValueChange={setClave}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLAVES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
