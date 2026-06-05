import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock, Plus, Pencil, Upload, FileText, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePermisos } from "@/lib/permisos";
import { useEmpresas, useAreas } from "@/hooks/useCatalogos";
import { uploadFile, sanitizeSegment } from "@/lib/storage";
import { SignedFileLink } from "@/components/common/SignedFileLink";
import { diasInfo } from "@/lib/pncUtils";
import { deleteEvento } from "@/lib/calendarSync";
import {
  StatusBadge, PNC_ESTATUS, PNC_RAZON_LABEL, PNC_ORIGEN_LABEL, PNC_METODOLOGIA_LABEL,
} from "@/lib/badges";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export interface Pnc {
  id: string; numero_anio: string; descripcion: string; estatus: string;
  origen: string; empresa_id: string | null; area_id: string | null;
  proceso_documento_id: string | null; proceso_texto: string | null;
  razon: string | null; metodologia: string | null;
  fecha_origen: string; fecha_compromiso: string | null; fecha_cierre: string | null;
  solucion: string | null; observaciones: string | null;
}

const NEXT_STATES: Record<string, { value: string; label: string }[]> = {
  pendiente: [{ value: "en_proceso", label: "Pasar a En proceso" }],
  en_proceso: [{ value: "verificacion", label: "Pasar a Verificación" }],
  verificacion: [
    { value: "finalizado", label: "Marcar Finalizado" },
    { value: "en_proceso", label: "Regresar a En proceso (no favorable)" },
  ],
  finalizado: [],
};

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
  const info = diasInfo(pnc.fecha_origen, pnc.fecha_compromiso, pnc.estatus === "finalizado");
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
          <CambiarEstatus pnc={pnc} />
        </div>
      </SheetHeader>

      <Tabs defaultValue="registro">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="registro">Registro</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="evid">Evidencias</TabsTrigger>
          <TabsTrigger value="hist">Historial</TabsTrigger>
        </TabsList>
        <TabsContent value="registro" className="pt-4"><RegistroTab pnc={pnc} /></TabsContent>
        <TabsContent value="plan" className="pt-4"><PlanTab pnc={pnc} /></TabsContent>
        <TabsContent value="evid" className="pt-4"><EvidenciasTab pnc={pnc} /></TabsContent>
        <TabsContent value="hist" className="pt-4"><HistorialTab pncId={pnc.id} /></TabsContent>
      </Tabs>
    </>
  );
}

function CambiarEstatus({ pnc }: { pnc: Pnc }) {
  const qc = useQueryClient();
  const { perfil } = useAuth();
  const perms = usePermisos();
  const [target, setTarget] = useState<string | null>(null);
  const [comentario, setComentario] = useState("");

  const next = NEXT_STATES[pnc.estatus] ?? [];
  const noFavorable = pnc.estatus === "verificacion" && target === "en_proceso";

  const change = useMutation({
    mutationFn: async () => {
      if (!target) return;
      // Validaciones de flujo
      if (target === "verificacion") {
        const { count } = await supabase.from("pnc_acciones")
          .select("id", { count: "exact", head: true })
          .eq("pnc_id", pnc.id).eq("estatus", "completado");
        if ((count ?? 0) < 1) throw new Error("Se requiere al menos 1 acción completada.");
      }
      if (target === "finalizado") {
        if (!perms.finalizarPnc) throw new Error("No tienes permiso para finalizar PNC.");
        const { count } = await supabase.from("pnc_evidencias")
          .select("id", { count: "exact", head: true })
          .eq("pnc_id", pnc.id).eq("tipo", "cierre");
        if ((count ?? 0) < 1) throw new Error("Se requiere al menos 1 evidencia de cierre.");
      }
      if (noFavorable && !comentario.trim()) {
        throw new Error("El comentario es obligatorio en un resultado no favorable.");
      }
      const { error } = await supabase.from("pnc").update({
        estatus: target,
        ...(target === "finalizado" ? { fecha_cierre: new Date().toISOString().slice(0, 10) } : {}),
      }).eq("id", pnc.id);
      if (error) throw error;
      await supabase.from("pnc_historial_estatus").insert({
        pnc_id: pnc.id, estatus_anterior: pnc.estatus, estatus_nuevo: target,
        comentario: comentario || null, cambiado_por: perfil?.id ?? null,
      });
      if (target === "finalizado") await deleteEvento(pnc.id, "pnc");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pnc-detail", pnc.id] });
      qc.invalidateQueries({ queryKey: ["pnc"] });
      toast.success("Estatus actualizado");
      setTarget(null); setComentario("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (next.length === 0) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline">Cambiar estatus</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {next.map((n) => (
            <DropdownMenuItem key={n.value} onClick={() => setTarget(n.value)}>{n.label}</DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!target} onOpenChange={(v) => !v && setTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar cambio de estatus</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Comentario {noFavorable ? "(obligatorio)" : "(opcional)"}</Label>
            <Textarea value={comentario} onChange={(e) => setComentario(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>Cancelar</Button>
            <Button onClick={() => change.mutate()} disabled={change.isPending}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RegistroTab({ pnc }: { pnc: Pnc }) {
  const qc = useQueryClient();
  const { data: empresas = [] } = useEmpresas();
  const { data: areas = [] } = useAreas();
  const [editing, setEditing] = useState(false);
  const [solucion, setSolucion] = useState(pnc.solucion ?? "");
  const [observaciones, setObservaciones] = useState(pnc.observaciones ?? "");

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pnc")
        .update({ solucion: solucion || null, observaciones: observaciones || null }).eq("id", pnc.id);
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
        <Info label="Área" value={areas.find((a) => a.id === pnc.area_id)?.nombre ?? "—"} />
        <Info label="Razón" value={pnc.razon ? PNC_RAZON_LABEL[pnc.razon] : "—"} />
        <Info label="Metodología" value={pnc.metodologia ? PNC_METODOLOGIA_LABEL[pnc.metodologia] : "—"} />
        <Info label="Proceso" value={pnc.proceso_texto ?? (pnc.proceso_documento_id ? "Documento vinculado" : "—")} />
        <Info label="Fecha origen" value={pnc.fecha_origen} />
        <Info label="Fecha compromiso" value={pnc.fecha_compromiso ?? "—"} />
        <Info label="Fecha cierre" value={pnc.fecha_cierre ?? "—"} />
      </div>
      <div className="border-t border-border pt-3">
        {editing ? (
          <div className="space-y-2">
            <Label>Solución</Label>
            <Textarea value={solucion} onChange={(e) => setSolucion(e.target.value)} />
            <Label>Observaciones</Label>
            <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>Guardar</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <>
            <Info label="Solución" value={pnc.solucion ?? "—"} />
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

function PlanTab({ pnc }: { pnc: Pnc }) {
  const qc = useQueryClient();
  const { data: plan } = useQuery({
    queryKey: ["pnc-plan", pnc.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("pnc_plan_mejora").select("*").eq("pnc_id", pnc.id).maybeSingle();
      if (error) throw error;
      return data as { id: string; analisis_causa_raiz: string | null; fecha_inicio_plan: string | null; fecha_implementacion: string | null; kpi_dias: number | null } | null;
    },
  });
  const [causa, setCausa] = useState("");
  const [ini, setIni] = useState("");
  const [impl, setImpl] = useState("");
  const [loaded, setLoaded] = useState(false);
  if (plan && !loaded) {
    setCausa(plan.analisis_causa_raiz ?? ""); setIni(plan.fecha_inicio_plan ?? "");
    setImpl(plan.fecha_implementacion ?? ""); setLoaded(true);
  }

  const kpi = ini && impl ? Math.max(0, Math.floor((new Date(impl).getTime() - new Date(ini).getTime()) / 86400000)) : null;

  const savePlan = useMutation({
    mutationFn: async () => {
      const payload = { pnc_id: pnc.id, analisis_causa_raiz: causa || null, fecha_inicio_plan: ini || null, fecha_implementacion: impl || null, kpi_dias: kpi };
      if (plan) {
        const { error } = await supabase.from("pnc_plan_mejora").update(payload).eq("id", plan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pnc_plan_mejora").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pnc-plan", pnc.id] }); toast.success("Plan guardado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const hint = pnc.metodologia === "ishikawa" ? "Describe las categorías del diagrama de pescado."
    : pnc.metodologia === "cinco_porques" ? "Responde: ¿Por qué ocurrió? x5" : "Análisis de la causa raíz.";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Análisis causa raíz — <span className="text-muted-foreground">{hint}</span></Label>
        <Textarea rows={4} value={causa} onChange={(e) => setCausa(e.target.value)} />
        <div className="grid grid-cols-3 gap-2">
          <div><Label>Inicio plan</Label><Input type="date" value={ini} onChange={(e) => setIni(e.target.value)} /></div>
          <div><Label>Implementación</Label><Input type="date" value={impl} onChange={(e) => setImpl(e.target.value)} /></div>
          <div><Label>KPI días</Label><Input value={kpi ?? "—"} disabled /></div>
        </div>
        <Button size="sm" onClick={() => savePlan.mutate()} disabled={savePlan.isPending}>Guardar plan</Button>
      </div>
      <AccionesPlan pncId={pnc.id} />
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

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pnc_acciones").insert({ pnc_id: pncId, descripcion: desc, responsable_nombre: resp || null, estatus: "pendiente" });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pnc-acc", pncId] }); setDesc(""); setResp(""); },
    onError: (e: Error) => toast.error(e.message),
  });
  const cycle = useMutation({
    mutationFn: async (a: { id: string; estatus: string }) => {
      const order = ["pendiente", "en_proceso", "completado"];
      const next = order[(order.indexOf(a.estatus) + 1) % order.length];
      const { error } = await supabase.from("pnc_acciones").update({ estatus: next }).eq("id", a.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pnc-acc", pncId] }),
  });

  return (
    <div className="border-t border-border pt-3">
      <h4 className="mb-2 text-sm font-semibold text-foreground">Acciones correctivas</h4>
      <div className="space-y-2">
        {acciones.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
            <div>
              <p className="text-foreground">{a.descripcion}</p>
              <p className="text-xs text-muted-foreground">{a.responsable_nombre ?? "Sin responsable"}</p>
            </div>
            <button onClick={() => cycle.mutate(a)}>
              <StatusBadge cfg={{ pendiente: { label: "Pendiente", className: "", style: { backgroundColor: "#555A6B", color: "#fff" } }, en_proceso: { label: "En proceso", className: "", style: { backgroundColor: "#3B7DD8", color: "#fff" } }, completado: { label: "Completado", className: "", style: { backgroundColor: "#1BC8A0", color: "#0F1117" } } }[a.estatus]} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Input placeholder="Descripción de la acción" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <Input placeholder="Responsable" value={resp} onChange={(e) => setResp(e.target.value)} className="w-40" />
        <Button size="sm" onClick={() => add.mutate()} disabled={!desc.trim() || add.isPending}><Plus className="h-4 w-4" /></Button>
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
