import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEmpresas, useAreas, useUsuarios } from "@/hooks/useCatalogos";
import { nextPncNumero, addBusinessDays, toISODate } from "@/lib/pncUtils";
import { upsertEvento } from "@/lib/calendarSync";
import {
  PNC_ORIGEN_LABEL, PNC_RAZON_LABEL,
} from "@/lib/badges";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export function PncFormDialog({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const { perfil } = useAuth();
  const { data: empresas = [] } = useEmpresas();
  const { data: areas = [] } = useAreas();
  const { data: usuarios = [] } = useUsuarios();

  const [empresa, setEmpresa] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [origen, setOrigen] = useState("manual");
  const [areaIds, setAreaIds] = useState<string[]>([]);
  const [responsables, setResponsables] = useState<string[]>([]);
  const [nuevoResp, setNuevoResp] = useState("");
  const [procesoBusqueda, setProcesoBusqueda] = useState("");
  const [procesoDocId, setProcesoDocId] = useState<string>("");
  const [procesoTexto, setProcesoTexto] = useState("");
  const [razon, setRazon] = useState("nc_menor");
  
  const [fechaOrigen, setFechaOrigen] = useState(toISODate(new Date()));
  const [fechaCompromiso, setFechaCompromiso] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const { data: docs = [] } = useQuery({
    queryKey: ["doc-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos").select("id, codigo, nombre").eq("estatus", "vigente").order("codigo");
      if (error) throw error;
      return data as { id: string; codigo: string; nombre: string }[];
    },
  });

  const toggleArea = (id: string) =>
    setAreaIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const addResp = () => {
    const v = nuevoResp.trim();
    if (v && !responsables.includes(v)) setResponsables((prev) => [...prev, v]);
    setNuevoResp("");
  };

  useEffect(() => {
    if (open) {
      setEmpresa(""); setDescripcion(""); setOrigen("manual"); setAreaIds([]);
      setResponsables([]); setNuevoResp("");
      setProcesoBusqueda(""); setProcesoDocId(""); setProcesoTexto("");
      setRazon("nc_menor"); setMetodologia("na");
      setFechaOrigen(toISODate(new Date())); setFechaCompromiso(""); setObservaciones("");
    }
  }, [open]);

  // Auto-sugerir compromiso según razón
  useEffect(() => {
    if (razon === "nc_mayor" && fechaOrigen) {
      setFechaCompromiso(toISODate(addBusinessDays(new Date(fechaOrigen), 7)));
    }
  }, [razon, fechaOrigen]);

  const filteredDocs = procesoBusqueda
    ? docs.filter((d) =>
        d.codigo.toLowerCase().includes(procesoBusqueda.toLowerCase()) ||
        d.nombre.toLowerCase().includes(procesoBusqueda.toLowerCase()))
    : docs.slice(0, 30);

  const create = useMutation({
    mutationFn: async () => {
      const anio = new Date(fechaOrigen).getFullYear();
      const numero = await nextPncNumero(anio);
      const { data, error } = await supabase.from("pnc").insert({
        numero_anio: numero,
        descripcion,
        estatus: "pendiente",
        origen,
        empresa_id: empresa || null,
        area_id: areaIds[0] || null,
        area_ids: areaIds,
        responsables,
        proceso_documento_id: procesoDocId || null,
        proceso_texto: procesoDocId ? null : (procesoTexto || null),
        razon,
        metodologia,
        fecha_origen: fechaOrigen,
        fecha_compromiso: fechaCompromiso || null,
        observaciones: observaciones || null,
        creado_por: perfil?.id ?? null,
      }).select("id").single();
      if (error) throw error;
      await supabase.from("pnc_historial_estatus").insert({
        pnc_id: data.id, estatus_anterior: null, estatus_nuevo: "pendiente",
        comentario: "PNC creado", cambiado_por: perfil?.id ?? null,
      });
      if (fechaCompromiso) {
        await upsertEvento({
          tipo: "pnc", titulo: `${numero}: ${descripcion.slice(0, 40)}`,
          descripcion, fecha_inicio: fechaCompromiso, referencia_id: data.id,
          referencia_tabla: "pnc", empresa_id: empresa || null, area_id: areaIds[0] || null,
        });
      }
      return numero;
    },
    onSuccess: (numero) => {
      qc.invalidateQueries({ queryKey: ["pnc"] });
      toast.success(`${numero} creado`);
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const metodHint = razon === "nc_mayor"
    ? "Recuerda: NC Mayor → compromiso 7 días hábiles."
    : "NC Menor / OM → antes de la siguiente auditoría.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Nuevo Producto No Conforme</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
          <F label="Empresa">
            <Sel value={empresa} onChange={setEmpresa} options={empresas.map((e) => ({ value: e.id, label: e.nombre }))} />
          </F>
          <F label="Origen">
            <Sel value={origen} onChange={setOrigen} options={Object.entries(PNC_ORIGEN_LABEL).map(([value, label]) => ({ value, label }))} />
          </F>
          <F label="Descripción" full>
            <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </F>
          <F label="Áreas">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal">
                  {areaIds.length === 0
                    ? "Selecciona áreas..."
                    : `${areaIds.length} área${areaIds.length > 1 ? "s" : ""} seleccionada${areaIds.length > 1 ? "s" : ""}`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
                <ScrollArea className="h-48">
                  {areas.length === 0 ? (
                    <p className="px-2 py-1.5 text-sm text-muted-foreground">No hay áreas disponibles.</p>
                  ) : (
                    areas.map((a) => (
                      <div
                        key={a.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-elevated"
                        onClick={() => toggleArea(a.id)}
                      >
                        <Checkbox checked={areaIds.includes(a.id)} />
                        <span className="text-sm">{a.nombre}</span>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
            {areaIds.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {areaIds.map((id) => {
                  const a = areas.find((x) => x.id === id);
                  return a ? (
                    <span key={id} className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                      {a.nombre}
                      <button type="button" onClick={() => setAreaIds((prev) => prev.filter((x) => x !== id))} className="hover:text-primary/70">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </F>
          <F label="Responsables" full>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={nuevoResp}
                  onChange={(e) => setNuevoResp(e.target.value)}
                  placeholder="Nombre del responsable..."
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addResp(); } }}
                />
                <Button type="button" variant="outline" size="icon" onClick={addResp}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Select value="" onValueChange={(id) => {
                const u = usuarios.find((x) => x.id === id);
                if (u && !responsables.includes(u.nombre_completo)) setResponsables((prev) => [...prev, u.nombre_completo]);
              }}>
                <SelectTrigger className="text-xs text-muted-foreground">
                  <SelectValue placeholder="O selecciona un usuario del sistema..." />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((u) => <SelectItem key={u.id} value={u.id}>{u.nombre_completo}</SelectItem>)}
                </SelectContent>
              </Select>
              {responsables.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {responsables.map((r, i) => (
                    <span key={i} className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                      {r}
                      <button type="button" onClick={() => setResponsables((prev) => prev.filter((_, j) => j !== i))} className="hover:text-primary/70">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </F>
          <F label="Razón">
            <Sel value={razon} onChange={setRazon} options={Object.entries(PNC_RAZON_LABEL).map(([value, label]) => ({ value, label }))} />
          </F>
          <F label="Proceso (buscar documento)" full>
            <Input value={procesoBusqueda} onChange={(e) => setProcesoBusqueda(e.target.value)} placeholder="Código o nombre…" />
            <Sel value={procesoDocId} onChange={setProcesoDocId} options={filteredDocs.map((d) => ({ value: d.id, label: `${d.codigo} — ${d.nombre}` }))} placeholder="Selecciona un documento (opcional)" />
            {!procesoDocId && (
              <Input className="mt-2" value={procesoTexto} onChange={(e) => setProcesoTexto(e.target.value)} placeholder="...o escribe el proceso libremente" />
            )}
          </F>
          <div className="flex items-end text-xs text-muted-foreground">{metodHint}</div>
          <F label="Fecha origen">
            <Input type="date" value={fechaOrigen} onChange={(e) => setFechaOrigen(e.target.value)} />
          </F>
          <F label="Fecha compromiso">
            <Input type="date" value={fechaCompromiso} onChange={(e) => setFechaCompromiso(e.target.value)} />
          </F>
          <F label="Observaciones" full>
            <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
          </F>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => create.mutate()} disabled={!descripcion.trim() || create.isPending}>
            {create.isPending ? "Creando…" : "Crear PNC"}
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
