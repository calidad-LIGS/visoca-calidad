import { useState, useEffect, type KeyboardEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEmpresas, useAreas } from "@/hooks/useCatalogos";
import { EVENT_COLORS } from "@/lib/calendarSync";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ManualEventoDialog({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const { perfil } = useAuth();
  const { data: empresas = [] } = useEmpresas();
  const { data: areas = [] } = useAreas();

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [area, setArea] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [invitados, setInvitados] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setTitulo(""); setDescripcion(""); setFechaInicio(""); setFechaFin("");
      setEmpresa(""); setArea(""); setEmailInput(""); setInvitados([]);
    }
  }, [open]);

  const addEmail = () => {
    const value = emailInput.trim().toLowerCase();
    if (!value) return;
    if (!EMAIL_RE.test(value)) {
      toast.error("Correo no válido");
      return;
    }
    if (invitados.includes(value)) {
      toast.error("Ese correo ya fue agregado");
      return;
    }
    setInvitados((prev) => [...prev, value]);
    setEmailInput("");
  };

  const onEmailKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEmail();
    }
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("eventos_calendario").insert({
        tipo: "manual",
        titulo,
        descripcion: descripcion || null,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin || null,
        empresa_id: empresa || null,
        area_id: area || null,
        color: EVENT_COLORS.manual,
        all_day: true,
        invitados_email: invitados,
        creado_por: perfil?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eventos_calendario"] });
      toast.success("Evento creado");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Nuevo evento</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Fecha inicio</Label>
              <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha fin (opcional)</Label>
              <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Empresa</Label>
              <Select value={empresa || undefined} onValueChange={setEmpresa}>
                <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                <SelectContent>
                  {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Área</Label>
              <Select value={area || undefined} onValueChange={setArea}>
                <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                <SelectContent>
                  {areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Invitar personas</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="correo@ejemplo.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={onEmailKeyDown}
              />
              <Button type="button" variant="outline" size="icon" onClick={addEmail}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {invitados.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {invitados.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-elevated px-2 py-0.5 text-xs text-foreground"
                  >
                    {email}
                    <button
                      type="button"
                      aria-label={`Quitar ${email}`}
                      onClick={() => setInvitados((prev) => prev.filter((x) => x !== email))}
                      className="text-muted-foreground hover:text-danger"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Los invitados se incluyen al exportar el evento a .ics para enviar invitaciones desde Google Calendar.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => create.mutate()} disabled={!titulo.trim() || !fechaInicio || create.isPending}>
            {create.isPending ? "Creando…" : "Crear evento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
