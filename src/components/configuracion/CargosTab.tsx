import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAreas } from "@/hooks/useCatalogos";
import { DataTable, Td } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface CargoRow extends Cargo {
  cargo_areas: { area_id: string; areas: { nombre: string } | null }[];
}

export function CargosTab() {
  const qc = useQueryClient();
  const { data: areas = [] } = useAreas();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cargo | null>(null);
  const [nombre, setNombre] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  const { data: cargos = [], isLoading } = useQuery({
    queryKey: ["cargos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cargos")
        .select("id, nombre, activo, cargo_areas(area_id, areas(nombre))")
        .order("nombre");
      if (error) throw error;
      return data as unknown as CargoRow[];
    },
  });

  const { data: cargoAreas = [] } = useQuery({
    queryKey: ["cargo-areas", editing?.id],
    enabled: !!editing?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("cargo_areas")
        .select("area_id")
        .eq("cargo_id", editing!.id);
      return (data ?? []).map((r) => r.area_id);
    },
  });

  useEffect(() => {
    if (editing?.id) setSelectedAreas(cargoAreas);
  }, [cargoAreas, editing?.id]);

  const toggleCargoArea = (areaId: string) => {
    setSelectedAreas((prev) =>
      prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId],
    );
  };

  const save = useMutation({
    mutationFn: async () => {
      let cargoId: string;
      if (editing) {
        const { error } = await supabase
          .from("cargos")
          .update({ nombre })
          .eq("id", editing.id);
        if (error) throw error;
        cargoId = editing.id;
      } else {
        const { data, error } = await supabase
          .from("cargos")
          .insert({ nombre })
          .select("id")
          .single();
        if (error) throw error;
        cargoId = data.id;
      }

      // Eliminar relaciones anteriores y crear las nuevas
      await supabase.from("cargo_areas").delete().eq("cargo_id", cargoId);
      if (selectedAreas.length > 0) {
        await supabase
          .from("cargo_areas")
          .insert(selectedAreas.map((area_id) => ({ cargo_id: cargoId, area_id })));
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cargos"] });
      qc.invalidateQueries({ queryKey: ["cargo-areas"] });
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
    setSelectedAreas([]);
    setOpen(true);
  };
  const openEdit = (c: Cargo) => {
    setEditing(c);
    setNombre(c.nombre);
    setSelectedAreas([]);
    setOpen(true);
  };

  const areasLabel = (row: CargoRow) => {
    const nombres = (row.cargo_areas ?? [])
      .map((ca) => ca.areas?.nombre)
      .filter(Boolean) as string[];
    if (nombres.length === 0) return "—";
    const shown = nombres.slice(0, 2).join(", ");
    return nombres.length > 2 ? `${shown} +${nombres.length - 2}` : shown;
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openNew}>
          <Plus className="mr-1.5 h-4 w-4" /> Nuevo cargo
        </Button>
      </div>

      <DataTable
        headers={["Nombre", "Áreas", "Activo", ""]}
        isEmpty={!isLoading && cargos.length === 0}
        empty="No hay cargos registrados."
      >
        {cargos.map((c) => (
          <tr key={c.id}>
            <Td className="font-medium text-foreground">{c.nombre}</Td>
            <Td className="text-muted-foreground">{areasLabel(c)}</Td>
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
            <div className="space-y-2 mt-3">
              <Label className="text-sm">Áreas donde aplica</Label>
              <ScrollArea className="h-36 rounded-md border border-border p-2">
                {areas.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-2 py-1 cursor-pointer"
                    onClick={() => toggleCargoArea(a.id)}
                  >
                    <Checkbox checked={selectedAreas.includes(a.id)} />
                    <span className="text-sm">{a.nombre}</span>
                  </div>
                ))}
              </ScrollArea>
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
