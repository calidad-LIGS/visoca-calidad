import { useState } from "react";
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

export function CargosTab() {
  const qc = useQueryClient();
  const { data: areas = [] } = useAreas();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNombre, setEditingNombre] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  // 1. Query simple de cargos (sin join)
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

  // 2. Query separada de todas las relaciones cargo-área
  const { data: todasCargoAreas = [] } = useQuery({
    queryKey: ["cargo-areas-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cargo_areas")
        .select("cargo_id, area_id");
      if (error) { console.warn("[cargo_areas]", error.message); return []; }
      return (data ?? []) as { cargo_id: string; area_id: string }[];
    },
    retry: false,
  });

  const toggleCargoArea = (areaId: string) => {
    setSelectedAreas((prev) =>
      prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId],
    );
  };

  const save = useMutation({
    mutationFn: async () => {
      let cargoId: string;
      if (editingId) {
        const { error } = await supabase
          .from("cargos")
          .update({ nombre: editingNombre })
          .eq("id", editingId);
        if (error) throw error;
        cargoId = editingId;
      } else {
        const { data, error } = await supabase
          .from("cargos")
          .insert({ nombre: editingNombre })
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
      qc.invalidateQueries({ queryKey: ["cargo-areas-all"] });
      toast.success(editingId ? "Cargo actualizado" : "Cargo creado");
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
    setEditingId(null);
    setEditingNombre("");
    setSelectedAreas([]);
    setOpen(true);
  };

  const openEdit = (c: Cargo) => {
    const areasActuales = todasCargoAreas
      .filter((ca) => ca.cargo_id === c.id)
      .map((ca) => ca.area_id)
      .filter(Boolean) as string[];
    setEditingId(c.id);
    setEditingNombre(c.nombre);
    setSelectedAreas(areasActuales);
    setOpen(true);
  };

  const areasLabel = (cargoId: string) => {
    const areaIds = todasCargoAreas
      .filter((ca) => ca.cargo_id === cargoId)
      .map((ca) => ca.area_id);
    const nombres = areaIds
      .map((id) => areas.find((a) => a.id === id)?.nombre)
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
            <Td className="text-muted-foreground">{areasLabel(c.id)}</Td>
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
            <DialogTitle>{editingId ? "Editar cargo" : "Nuevo cargo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cargo-nombre">Nombre</Label>
              <Input
                id="cargo-nombre"
                value={editingNombre}
                onChange={(e) => setEditingNombre(e.target.value)}
              />
            </div>
            <div className="space-y-2 mt-3">
              <Label htmlFor="cargo-areas" className="text-sm">
                Áreas donde aplica
              </Label>
              <ScrollArea
                id="cargo-areas"
                className="h-36 rounded-md border border-border p-2"
              >
                {areas.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-elevated rounded px-1"
                    onClick={() => toggleCargoArea(a.id)}
                  >
                    <Checkbox
                      checked={selectedAreas.includes(a.id)}
                      onCheckedChange={() => toggleCargoArea(a.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm select-none">{a.nombre}</span>
                  </div>
                ))}
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                {selectedAreas.length} áreas seleccionadas
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => save.mutate()}
              disabled={!editingNombre.trim() || save.isPending}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
