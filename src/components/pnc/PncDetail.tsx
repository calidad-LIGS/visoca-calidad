import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock, Plus, Pencil, Upload, FileText, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

import { useEmpresas, useAreas } from "@/hooks/useCatalogos";
import { uploadFile, sanitizeSegment } from "@/lib/storage";
import { SignedFileLink } from "@/components/common/SignedFileLink";
import { diasInfo } from "@/lib/pncUtils";

import {
  StatusBadge, PNC_ESTATUS, PNC_RAZON_LABEL, PNC_ORIGEN_LABEL,
} from "@/lib/badges";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export interface Pnc {
  id: string; numero_anio: string; descripcion: string; estatus: string;
  origen: string; empresa_id: string | null; area_id: string | null;
  area_ids: string[] | null; responsables: string[] | null;
  proceso_documento_id: string | null; proceso_texto: string | null;
  razon: string | null; metodologia: string | null;
  fecha_origen: string; fecha_compromiso: string | null; fecha_cierre: string | null;
  solucion: string | null; observaciones: string | null;
}


export function PncDetail({
  pncId, onClose,
}: { pncId: string | null; onClose: () => void }) {
  const isMobile = useIsMobile();
  return (
    <Sheet open={!!pncId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "overflow-y-auto",
          isMobile ? "h-[90vh]" : "w-full sm:max-w-[700px]",
        )}
      >
        {pncId && <Body pncId={pncId} />}
      </SheetContent>
    </Sheet>
  );
}

function Body({ pncId }: { pncId: string }) {
  const { data: pnc } = useQuery({
    queryKey: ["pnc-detail", pncId],
    queryFn: async () => {
      const { data, error } = await supabase.from("pnc").select("*").eq("id", pncId).single();
      if (error) throw error;
      return data as Pnc;
    },
  });

  if (!pnc) return null;
  const info = diasInfo(pnc.fecha_origen, pnc.fecha_compromiso, pnc.estatus === "cerrado");
  const colorClass = { accent: "text-accent", warning: "text-warning", danger: "text-danger" }[info.color];

  return (
    <>
      <SheetHeader className="mb-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-lg font-semibold text-primary">{pnc.numero_anio}</span>
          <StatusBadge cfg={PNC_ESTATUS[pnc.estatus]} />
        </div>
        <SheetTitle className="text-sm font-normal text-muted-foreground">{pnc.descripcion}</SheetTitle>
        <div className="flex items-center justify-between pt-1">
          <span className={`flex items-center gap-1.5 text-xs ${colorClass}`}>
            <Clock className="h-3.5 w-3.5" /> {info.dias} días desde origen
          </span>
        </div>
      </SheetHeader>

      <Tabs defaultValue="registro">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="registro">Registro</TabsTrigger>
          <TabsTrigger value="acciones">Acciones</TabsTrigger>
          <TabsTrigger value="hist">Historial</TabsTrigger>
        </TabsList>
        <TabsContent value="registro" className="pt-4"><RegistroTab pnc={pnc} /></TabsContent>
        <TabsContent value="acciones" className="pt-4"><AccionesPlan pncId={pnc.id} /></TabsContent>
        <TabsContent value="hist" className="pt-4"><HistorialTab pncId={pnc.id} /></TabsContent>
      </Tabs>
    </>
  );
}



function RegistroTab({ pnc }: { pnc: Pnc }) {
  const qc = useQueryClient();
  const { data: empresas = [] } = useEmpresas();
  const { data: areas = [] } = useAreas();
  const [editing, setEditing] = useState(false);
  const [observaciones, setObservaciones] = useState(pnc.observaciones ?? "");

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pnc")
        .update({ observaciones: observaciones || null }).eq("id", pnc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pnc-detail", pnc.id] });
      toast.success("Registro actualizado"); setEditing(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Info label="Origen" value={PNC_ORIGEN_LABEL[pnc.origen] ?? pnc.origen} />
        <Info label="Empresa" value={empresas.find((e) => e.id === pnc.empresa_id)?.nombre ?? "—"} />
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Área</p>
          {(pnc.area_ids?.length ?? 0) > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {(pnc.area_ids ?? []).map((id) => (
                <span key={id} className="rounded bg-elevated px-2 py-0.5 text-xs text-foreground">
                  {areas.find((a) => a.id === id)?.nombre ?? id}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-0.5 text-foreground">{areas.find((a) => a.id === pnc.area_id)?.nombre ?? "—"}</p>
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Responsable</p>
          {(pnc.responsables?.length ?? 0) > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {(pnc.responsables ?? []).map((r, i) => (
                <span key={i} className="rounded bg-elevated px-2 py-0.5 text-xs text-foreground">{r}</span>
              ))}
            </div>
          ) : (
            <p className="mt-0.5 text-foreground">—</p>
          )}
        </div>
        <Info label="Razón" value={pnc.razon ? PNC_RAZON_LABEL[pnc.razon] : "—"} />
        <Info label="Proceso" value={pnc.proceso_texto ?? (pnc.proceso_documento_id ? "Documento vinculado" : "—")} />
        <Info label="Fecha origen" value={pnc.fecha_origen} />
        <Info label="Fecha compromiso" value={pnc.fecha_compromiso ?? "—"} />
        <Info label="Fecha cierre" value={pnc.fecha_cierre ?? "—"} />
      </div>
      <div className="border-t border-border pt-3">
        {editing ? (
          <div className="space-y-2">
            <Label>Observaciones</Label>
            <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>Guardar</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-2"><Info label="Observaciones" value={pnc.observaciones ?? "—"} /></div>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setEditing(true)}>
              <Pencil className="mr-1.5 h-4 w-4" /> Editar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function AccionesPlan({ pncId }: { pncId: string }) {
  const qc = useQueryClient();
  const { data: acciones = [] } = useQuery({
    queryKey: ["pnc-acc", pncId],
    queryFn: async () => {
      const { data, error } = await supabase.from("pnc_acciones").select("*").eq("pnc_id", pncId).order("created_at");
      if (error) throw error;
      return data as Array<{ id: string; descripcion: string; responsable_nombre: string | null; fecha_inicio: string | null; fecha_fin: string | null; estatus: string }>;
    },
  });
  const [desc, setDesc] = useState("");
  const [resp, setResp] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [evidenciaFile, setEvidenciaFile] = useState<File | null>(null);

  const add = useMutation({
    mutationFn: async () => {
      const tieneEvidencia = !!evidenciaFile;
      const { error } = await supabase.from("pnc_acciones").insert({
        pnc_id: pncId,
        descripcion: desc,
        responsable_nombre: resp || null,
        fecha_inicio: fechaInicio || null,
        fecha_fin: fechaFin || null,
        estatus: "completado",
      });
      if (error) throw error;
      if (tieneEvidencia && evidenciaFile) {
        const path = `${sanitizeSegment(pncId)}/cierre-${Date.now()}-${sanitizeSegment(evidenciaFile.name)}`;
        await uploadFile("pnc-evidencias", path, evidenciaFile);
        const { error: upErr } = await supabase.from("pnc").update({
          estatus: "cerrado",
          fecha_cierre: new Date().toISOString().slice(0, 10),
        }).eq("id", pncId);
        if (upErr) throw upErr;
      }
      return tieneEvidencia;
    },
    onSuccess: (cerrado) => {
      qc.invalidateQueries({ queryKey: ["pnc-acc", pncId] });
      qc.invalidateQueries({ queryKey: ["pnc"] });
      qc.invalidateQueries({ queryKey: ["pnc-detail", pncId] });
      setDesc(""); setResp(""); setFechaInicio(""); setFechaFin(""); setEvidenciaFile(null);
      toast.success(cerrado ? "Acción guardada — PNC cerrado" : "Acción guardada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-foreground">Acciones correctivas</h4>
      <div className="space-y-2">
        {acciones.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
            <div>
              <p className="text-foreground">{a.descripcion}</p>
              <p className="text-xs text-muted-foreground">{a.responsable_nombre ?? "Sin responsable"}</p>
            </div>
            <span className="rounded border border-border px-1.5 text-xs text-muted-foreground">{a.estatus}</span>
          </div>
        ))}
        {acciones.length === 0 && <p className="text-sm text-muted-foreground">Sin acciones registradas.</p>}
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <Label>Nueva acción correctiva</Label>
        <Textarea placeholder="Descripción de la acción" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Responsable</Label>
            <Input placeholder="Responsable" value={resp} onChange={(e) => setResp(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Fecha inicio</Label>
            <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Fecha fin</Label>
            <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Evidencia de cierre</Label>
            <Input type="file" accept="application/pdf,image/*" onChange={(e) => setEvidenciaFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Al adjuntar evidencia, el PNC se cerrará automáticamente.
        </p>
        <Button size="sm" onClick={() => add.mutate()} disabled={!desc.trim() || add.isPending}>
          <Plus className="mr-1.5 h-4 w-4" /> {add.isPending ? "Guardando…" : "Guardar acción"}
        </Button>
      </div>
    </div>
  );
}


function EvidenciasTab({ pnc }: { pnc: Pnc }) {
  const qc = useQueryClient();
  const { perfil } = useAuth();
  const [tipo, setTipo] = useState("seguimiento");
  const [file, setFile] = useState<File | null>(null);

  const { data: evidencias = [] } = useQuery({
    queryKey: ["pnc-evid", pnc.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("pnc_evidencias").select("*").eq("pnc_id", pnc.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Array<{ id: string; nombre_archivo: string; archivo_url: string; tipo: string; created_at: string }>;
    },
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Selecciona un archivo.");
      const path = `${sanitizeSegment(pnc.numero_anio)}/${tipo}-${Date.now()}-${sanitizeSegment(file.name)}`;
      const res = await uploadFile("pnc-evidencias", path, file);
      const { error } = await supabase.from("pnc_evidencias").insert({
        pnc_id: pnc.id, nombre_archivo: file.name, archivo_url: res.path, tipo, subido_por: perfil?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pnc-evid", pnc.id] }); toast.success("Evidencia subida"); setFile(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("pnc_evidencias").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pnc-evid", pnc.id] }),
  });

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Para finalizar un PNC se requiere al menos una evidencia de tipo "cierre".</p>
      <div className="grid gap-2">
        {evidencias.map((ev) => (
          <div key={ev.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
            <SignedFileLink bucket="pnc-evidencias" path={ev.archivo_url} className="flex items-center gap-2 text-foreground hover:underline">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>{ev.nombre_archivo}</span>
              <span className="rounded border border-border px-1.5 text-xs text-muted-foreground">{ev.tipo}</span>
            </SignedFileLink>
            <Button variant="ghost" size="icon" onClick={() => del.mutate(ev.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-border pt-3">
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="plan_mejora">Plan de mejora</SelectItem>
            <SelectItem value="cierre">Cierre</SelectItem>
            <SelectItem value="seguimiento">Seguimiento</SelectItem>
          </SelectContent>
        </Select>
        <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <Button size="sm" onClick={() => upload.mutate()} disabled={!file || upload.isPending}><Upload className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function HistorialTab({ pncId }: { pncId: string }) {
  const { data: hist = [] } = useQuery({
    queryKey: ["pnc-hist", pncId],
    queryFn: async () => {
      const { data, error } = await supabase.from("pnc_historial_estatus").select("*").eq("pnc_id", pncId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Array<{ id: string; estatus_anterior: string | null; estatus_nuevo: string; comentario: string | null; created_at: string }>;
    },
  });
  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {hist.map((h) => (
        <li key={h.id} className="relative">
          <span className="absolute -left-[1.45rem] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
          <div className="flex items-center gap-2 text-sm">
            <StatusBadge cfg={PNC_ESTATUS[h.estatus_nuevo]} />
            <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString("es-MX")}</span>
          </div>
          {h.comentario && <p className="text-sm text-muted-foreground">{h.comentario}</p>}
        </li>
      ))}
      {hist.length === 0 && <li className="text-sm text-muted-foreground">Sin historial.</li>}
    </ol>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground">{value}</p>
    </div>
  );
}
