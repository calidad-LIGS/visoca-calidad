import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ChevronLeft, Plus, FileText, Download, Lock, ChevronDown, ExternalLink, Search, X, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePermisos } from "@/lib/permisos";
import { useEmpresas, useAreas } from "@/hooks/useCatalogos";
import { crearHallazgoConPnc } from "@/lib/auditoriaUtils";
import { addBusinessDays, toISODate } from "@/lib/pncUtils";
import { uploadFile, sanitizeSegment } from "@/lib/storage";
import { SignedFileLink } from "@/components/common/SignedFileLink";
import { generarActaBlob, type ActaData } from "./ActaPdf";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTable, Td } from "@/components/common/DataTable";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StatusBadge, OutlineBadge, AUD_ESTATUS, HALLAZGO_TIPO_LABEL, APLICACION_LABEL } from "@/lib/badges";

const STEPS = ["programada", "en_ejecucion", "con_hallazgos", "en_seguimiento", "cerrada"];

export function AuditoriaDetail({ id }: { id: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: empresas = [] } = useEmpresas();
  const { data: areas = [] } = useAreas();

  const { data: aud, isLoading, error: audError } = useQuery({
    queryKey: ["auditoria", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("auditorias").select("*").eq("id", id).single();
      if (error) {
        console.error("[AuditoriaDetail] Error cargando auditoría:", error, "ID:", id);
        throw error;
      }
      return data;
    },
    retry: 2,
  });

  const { data: hallazgos = [] } = useQuery({
    queryKey: ["hallazgos", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("auditoria_hallazgos").select("*, pnc:pnc_id(numero_anio)").eq("auditoria_id", id).order("created_at");
      if (error) throw error;
      return data as Array<{ id: string; tipo: string; descripcion: string; departamento: string | null; area_id: string | null; responsable_nombre: string | null; estatus: string; pnc_id: string | null; pnc: { numero_anio: string } | null }>;
    },
  });

  const { data: acta } = useQuery({
    queryKey: ["acta", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("auditoria_actas").select("*").eq("auditoria_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return (
    <div className="p-6 text-muted-foreground flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" /> Cargando auditoría…
    </div>
  );

  if (audError || !aud) return (
    <div className="p-6">
      <Button variant="ghost" size="sm" className="mb-4"
        onClick={() => navigate({ to: "/auditorias" })}>
        <ChevronLeft className="mr-1 h-4 w-4" /> Volver
      </Button>
      <div className="rounded-lg border border-danger/30 bg-danger/10 p-4">
        <p className="font-semibold text-danger mb-1">No se pudo cargar la auditoría</p>
        <p className="text-sm text-muted-foreground">
          {audError?.message ?? "Registro no encontrado o sin permisos de acceso."}
        </p>
      </div>
    </div>
  );

  const empresaNombres = (aud.empresa_ids as string[]).map((eid) => empresas.find((e) => e.id === eid)?.clave ?? eid).join(", ");
  const stepIdx = STEPS.indexOf(aud.estatus);

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-2" onClick={() => navigate({ to: "/auditorias" })}>
        <ChevronLeft className="mr-1 h-4 w-4" /> Auditorías
      </Button>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-foreground">{aud.codigo_auditoria}</h1>
        <span className="rounded-md px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: aud.tipo === "interna" ? "#3B7DD8" : "#8B5CF6", color: "#fff" }}>
          {aud.tipo === "interna" ? "Interna" : "Externa"}
        </span>
        <StatusBadge cfg={AUD_ESTATUS[aud.estatus]} />
      </div>

      {/* Timeline */}
      <div className="mb-6 flex items-center gap-1 overflow-x-auto rounded-lg border border-border bg-card p-4">
        {STEPS.map((step, i) => (
          <div key={step} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: i < stepIdx ? "#1BC8A0" : i === stepIdx ? "#3B7DD8" : "#242736", color: i <= stepIdx ? "#fff" : "#8B90A0" }}>
                {i + 1}
              </div>
              <span className="whitespace-nowrap text-[10px] text-muted-foreground">{AUD_ESTATUS[step]?.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="mx-1 h-0.5 flex-1" style={{ backgroundColor: i < stepIdx ? "#1BC8A0" : "#2E3347" }} />}
          </div>
        ))}
      </div>

      {/* Datos generales */}
      <Collapsible defaultOpen className="mb-6 rounded-lg border border-border bg-card">
        <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
          <span className="font-display font-semibold text-foreground">Datos generales</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </CollapsibleTrigger>
        <CollapsibleContent className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border p-4 text-sm lg:grid-cols-3">
          <Info label="Tipo" value={aud.tipo} />
          <Info label="Año" value={String(aud.anio)} />
          <Info label="Período" value={`${aud.fecha_inicio ?? "—"} → ${aud.fecha_fin ?? "—"}`} />
          <Info label="Empresas" value={empresaNombres || "—"} />
          <Info label="Certificación" value={aud.certificacion ?? "—"} />
          <Info label="Modalidad" value={aud.modalidad ?? "—"} />
          <Info label="Áreas" value={(aud.areas_auditadas as string[]).map((a) => areas.find((x) => x.id === a)?.nombre ?? a).join(", ") || "—"} />
          <Info label="Notas" value={aud.notas ?? "—"} />
          <div className="col-span-full flex gap-2">
            {aud.informe_url && <Button asChild size="sm" variant="outline"><a href={aud.informe_url} target="_blank" rel="noreferrer"><FileText className="mr-1.5 h-4 w-4" /> Ver informe</a></Button>}
            {aud.informe_drive_url && <Button asChild size="sm" variant="outline"><a href={aud.informe_drive_url} target="_blank" rel="noreferrer"><ExternalLink className="mr-1.5 h-4 w-4" /> Drive</a></Button>}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <HallazgosSection aud={aud} hallazgos={hallazgos} />

      <ActaSection aud={aud} hallazgos={hallazgos} acta={acta} empresaNombres={empresaNombres} areas={areas} />

      <CierreSection aud={aud} />

      <div className="h-10" />
    </div>
  );

  function Info({ label, value }: { label: string; value: string }) {
    return <div><p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-0.5 text-foreground">{value}</p></div>;
  }
}

function HallazgosSection({ aud, hallazgos }: { aud: Record<string, unknown>; hallazgos: Array<{ id: string; tipo: string; descripcion: string; departamento: string | null; area_id: string | null; responsable_nombre: string | null; estatus: string; pnc_id: string | null; pnc: { numero_anio: string } | null }> }) {
  const qc = useQueryClient();
  const { perfil } = useAuth();
  const perms = usePermisos();
  const navigate = useNavigate();
  const { data: areas = [] } = useAreas();
  const [adding, setAdding] = useState(false);
  const [tipo, setTipo] = useState<"nc_mayor" | "nc_menor" | "oportunidad_mejora">("nc_menor");
  const [descripcion, setDescripcion] = useState("");
  const [depto, setDepto] = useState("");
  const [area, setArea] = useState("");
  const [resp, setResp] = useState("");
  // Proceso afectado
  const [procesoQuery, setProcesoQuery] = useState("");
  const [procesoDocId, setProcesoDocId] = useState<string | null>(null);
  const [procesoDocLabel, setProcesoDocLabel] = useState("");
  const [procesoTexto, setProcesoTexto] = useState("");

  const { data: docResults = [] } = useQuery({
    queryKey: ["doc-search", procesoQuery],
    enabled: procesoQuery.trim().length >= 2 && !procesoDocId,
    queryFn: async () => {
      const q = procesoQuery.trim();
      const { data, error } = await supabase
        .from("documentos")
        .select("id, codigo, nombre")
        .or(`codigo.ilike.%${q}%,nombre.ilike.%${q}%`)
        .limit(5);
      if (error) throw error;
      return data as Array<{ id: string; codigo: string; nombre: string }>;
    },
  });

  // Fecha compromiso sugerida (solo informativa)
  const fechaSugerida =
    tipo === "nc_mayor"
      ? `+ 7 días hábiles desde hoy → ${toISODate(addBusinessDays(new Date(), 7))}`
      : tipo === "nc_menor"
        ? "Antes de la siguiente auditoría"
        : "Sin fecha compromiso (oportunidad de mejora)";

  const resetForm = () => {
    setAdding(false); setDescripcion(""); setDepto(""); setArea(""); setResp("");
    setProcesoQuery(""); setProcesoDocId(null); setProcesoDocLabel(""); setProcesoTexto("");
  };

  const add = useMutation({
    mutationFn: async () => {
      await crearHallazgoConPnc(
        {
          auditoria_id: aud.id as string,
          tipo,
          descripcion,
          departamento: depto.trim() || null,
          proceso_documento_id: procesoDocId || null,
          proceso_texto: procesoDocId ? null : (procesoTexto.trim() || null),
          area_id: area || null,
          responsable_nombre: resp || null,
        },
        { tipo: aud.tipo as string, fecha_inicio: aud.fecha_inicio as string | null, empresa_ids: (aud.empresa_ids as string[]) ?? [], creado_por: perfil?.id ?? null },
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hallazgos", aud.id] });
      qc.invalidateQueries({ queryKey: ["auditoria", aud.id] });
      qc.invalidateQueries({ queryKey: ["pnc"] });
      toast.success("Hallazgo registrado y PNC generado");
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mb-6 rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-display font-semibold text-foreground">Hallazgos ({hallazgos.length})</span>
        {perms.editarAuditoria && aud.estatus !== "cerrada" && (
          <Button size="sm" variant="outline" onClick={() => (adding ? resetForm() : setAdding(true))}><Plus className="mr-1.5 h-4 w-4" /> Registrar hallazgo</Button>
        )}
      </div>

      {adding && (
        <div className="mb-4 rounded-md border border-border bg-elevated/40 p-3">
          <p className="mb-3 font-display text-sm font-semibold text-foreground">Registrar hallazgo</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label>Departamento auditado</Label>
              <Input
                value={depto}
                onChange={(e) => setDepto(e.target.value)}
                placeholder="Ej: Administración, Facturación, Logística..."
              />
            </div>
            <div className="space-y-1"><Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nc_mayor">NC Mayor</SelectItem>
                  <SelectItem value="nc_menor">NC Menor</SelectItem>
                  <SelectItem value="oportunidad_mejora">Oportunidad de mejora</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Área afectada</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                <SelectContent>{areas.map((a) => (<SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>))}</SelectContent>
              </Select>
            </div>

            <div className="space-y-1 sm:col-span-2"><Label>Descripción</Label><Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} /></div>

            {/* Proceso afectado */}
            <div className="space-y-1 sm:col-span-2">
              <Label>Proceso afectado</Label>
              {procesoDocId ? (
                <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
                  <span className="font-mono text-xs text-primary">{procesoDocLabel}</span>
                  <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => { setProcesoDocId(null); setProcesoDocLabel(""); setProcesoQuery(""); }}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="pl-8" placeholder="Buscar documento por código o nombre…" value={procesoQuery} onChange={(e) => setProcesoQuery(e.target.value)} />
                  </div>
                  {docResults.length > 0 && (
                    <ul className="mt-1 divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
                      {docResults.map((d) => (
                        <li key={d.id}>
                          <button type="button" className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-elevated"
                            onClick={() => { setProcesoDocId(d.id); setProcesoDocLabel(`${d.codigo} — ${d.nombre}`); setProcesoTexto(""); }}>
                            <span className="font-mono text-xs text-primary">{d.codigo}</span>
                            <span className="text-xs text-muted-foreground">{d.nombre}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Input className="mt-1" placeholder="…o escribe el proceso libremente" value={procesoTexto} onChange={(e) => setProcesoTexto(e.target.value)} />
                </>
              )}
            </div>

            <div className="space-y-1"><Label>Responsable</Label><Input value={resp} onChange={(e) => setResp(e.target.value)} /></div>

            <div className="space-y-1">
              <Label>Fecha compromiso sugerida</Label>
              <div className="flex h-9 items-center rounded-md border border-border bg-card px-3 text-xs text-muted-foreground">{fechaSugerida}</div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => add.mutate()} disabled={!descripcion.trim() || add.isPending}>Guardar hallazgo</Button>
            <Button size="sm" variant="outline" onClick={resetForm}>Cancelar</Button>
          </div>
        </div>
      )}

      <DataTable headers={["Tipo", "Departamento", "Descripción", "Área", "Responsable", "PNC", "Estatus"]} isEmpty={hallazgos.length === 0} empty="Sin hallazgos registrados en esta auditoría.">
        {hallazgos.map((h) => (
          <tr key={h.id}>
            <Td><OutlineBadge>{HALLAZGO_TIPO_LABEL[h.tipo]}</OutlineBadge></Td>
            <Td>{h.departamento || "—"}</Td>
            <Td className="max-w-[20rem] truncate text-foreground">{h.descripcion}</Td>
            <Td>{areas.find((a) => a.id === h.area_id)?.nombre ?? "—"}</Td>
            <Td>{h.responsable_nombre ?? "—"}</Td>
            <Td>{h.pnc_id ? <button className="font-mono text-xs text-primary hover:underline" onClick={() => navigate({ to: "/no-conformidades", search: { pncId: h.pnc_id ?? "" } })}>{h.pnc?.numero_anio ?? "PNC"}</button> : "—"}</Td>
            <Td className="text-xs">{h.estatus}</Td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

function ActaSection({ aud, hallazgos, acta, empresaNombres, areas }: {
  aud: Record<string, unknown>;
  hallazgos: Array<{ tipo: string; descripcion: string; responsable_nombre: string | null; estatus: string }>;
  acta: Record<string, unknown> | null | undefined;
  empresaNombres: string;
  areas: { id: string; nombre: string }[];
}) {
  void areas;
  const qc = useQueryClient();
  const { perfil } = useAuth();
  const perms = usePermisos();
  const [open, setOpen] = useState(false);
  const [departamento, setDepartamento] = useState("Calidad");
  const [responsable, setResponsable] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [generating, setGenerating] = useState(false);

  const { data: orgConfig } = useQuery({
    queryKey: ["org_config"],
    queryFn: async () => {
      const { data } = await supabase.from("org_config").select("*").limit(1).maybeSingle();
      return data;
    },
    staleTime: 300_000, // 5 minutos — cambia poco
  });

  const generar = async () => {
    setGenerating(true);
    try {
      const data: ActaData = {
        codigo: aud.codigo_auditoria as string,
        empresaNombre: empresaNombres,
        departamento, responsable,
        fecha: new Date().toISOString().slice(0, 10),
        descripcion,
        aplicacion: APLICACION_LABEL["iso_ola"],
        version: "1.0",
        orgNombre: orgConfig?.nombre_completo ?? "LIGS Group",
        orgLogoUrl: orgConfig?.logo_url ?? null,
        hallazgos: hallazgos.map((h) => ({
          tipo: h.tipo, descripcion: h.descripcion,
          responsable: h.responsable_nombre ?? responsable,
          compromiso: "Acción correctiva", fechaCompromiso: aud.fecha_fin as string ?? "",
          estatus: h.estatus,
        })),
      };
      const blob = await generarActaBlob(data);
      const file = new File([blob], `acta-${aud.codigo_auditoria}.pdf`, { type: "application/pdf" });
      const path = `${sanitizeSegment(aud.codigo_auditoria as string)}/acta-${Date.now()}.pdf`;
      const res = await uploadFile("auditorias", path, file);
      const { error } = await supabase.from("auditoria_actas").insert({
        auditoria_id: aud.id as string, departamento, responsable_nombre: responsable,
        fecha_acta: data.fecha, contenido_json: JSON.parse(JSON.stringify(data)),
        pdf_url: res.path, generado_por: perfil?.id ?? null,
      });
      if (error) throw error;
      await supabase.from("auditorias").update({ estatus: "en_seguimiento" }).eq("id", aud.id as string);
      qc.invalidateQueries({ queryKey: ["acta", aud.id] });
      qc.invalidateQueries({ queryKey: ["auditoria", aud.id] });
      toast.success("Acta generada");
      setOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mb-6 rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-display font-semibold text-foreground">Acta de Resultados</span>
        {perms.exportarActa && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button size="sm" variant="outline" disabled={hallazgos.length === 0} onClick={() => setOpen(true)}>
                    {acta ? "Regenerar acta" : "Generar Acta de Resultados"}
                  </Button>
                </span>
              </TooltipTrigger>
              {hallazgos.length === 0 && <TooltipContent>Agrega hallazgos primero</TooltipContent>}
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {acta?.pdf_url ? (
        <SignedFileLink bucket="auditorias" path={acta.pdf_url as string} className={buttonVariants({ size: "sm" })}><Download className="mr-1.5 h-4 w-4" /> Descargar PDF</SignedFileLink>
      ) : (
        <p className="text-sm text-muted-foreground">Aún no se ha generado el acta de resultados.</p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generar Acta de Resultados</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Departamento auditado</Label><Input value={departamento} onChange={(e) => setDepartamento(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Responsable del área</Label><Input value={responsable} onChange={(e) => setResponsable(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Descripción de la auditoría</Label><Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={generar} disabled={generating}>{generating ? "Generando…" : "Generar PDF"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CierreSection({ aud }: { aud: Record<string, unknown> }) {
  const qc = useQueryClient();
  const perms = usePermisos();
  const [open, setOpen] = useState(false);
  const [pendientes, setPendientes] = useState<{ numero_anio: string }[]>([]);

  const cerrar = useMutation({
    mutationFn: async () => {
      const { data: pncs, error } = await supabase.from("pnc").select("numero_anio, estatus").eq("auditoria_id", aud.id as string);
      if (error) throw error;
      const pend = (pncs ?? []).filter((p) => p.estatus !== "finalizado");
      if (pend.length > 0) {
        setPendientes(pend.map((p) => ({ numero_anio: p.numero_anio })));
        throw new Error("Hay PNC pendientes de finalizar.");
      }
      const { error: upErr } = await supabase.from("auditorias").update({ estatus: "cerrada" }).eq("id", aud.id as string);
      if (upErr) throw upErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auditoria", aud.id] });
      toast.success("Auditoría cerrada");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (aud.estatus === "cerrada") {
    return <div className="rounded-lg border border-accent/30 bg-accent/10 p-4 text-sm text-accent">Auditoría cerrada.</div>;
  }
  if (!perms.cerrarAuditoria) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <span className="font-display font-semibold text-foreground">Cierre de auditoría</span>
      <p className="mb-3 mt-1 text-sm text-muted-foreground">No se puede cerrar si hay hallazgos con PNC sin finalizar.</p>
      <Button size="sm" variant="outline" onClick={() => { setPendientes([]); setOpen(true); }}><Lock className="mr-1.5 h-4 w-4" /> Cerrar auditoría</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-danger">¿Cerrar esta auditoría?</DialogTitle></DialogHeader>
          <p className="py-2 text-sm text-muted-foreground">Esta acción no se puede deshacer.</p>
          {pendientes.length > 0 && (
            <div className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm">
              <p className="mb-1 font-medium text-danger">PNC pendientes:</p>
              <ul className="list-inside list-disc font-mono text-xs text-foreground">
                {pendientes.map((p) => (<li key={p.numero_anio}>{p.numero_anio}</li>))}
              </ul>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button style={{ backgroundColor: "#E54B4B", color: "#fff" }} onClick={() => cerrar.mutate()} disabled={cerrar.isPending}>Confirmar cierre</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
