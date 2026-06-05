import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Download, ExternalLink, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEmpresas, useAreas, useCargos } from "@/hooks/useCatalogos";
import { uploadFile, sanitizeSegment } from "@/lib/storage";
import { SignedFileLink } from "@/components/common/SignedFileLink";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  StatusBadge,
  OutlineBadge,
  DOC_ESTATUS,
  DOC_TIPO_LABEL,
  APLICACION_LABEL,
  NIVEL_LABEL,
} from "@/lib/badges";
import type { Documento } from "./DocumentoFormDialog";

const REL_LABELS: Record<string, string> = {
  padre: "Padre de",
  hijo: "Hijo de",
  sustituto: "Sustituye a",
  sustituido_por: "Sustituido por",
  referencia: "Referencia",
  referencia_mutua: "Se mencionan mutuamente",
};

export function DocumentoFicha({
  doc,
  onClose,
  onOpenDoc,
}: {
  doc: Documento | null;
  onClose: () => void;
  onOpenDoc?: (id: string) => void;
}) {
  const open = !!doc;
  const isMobile = useIsMobile();
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "overflow-y-auto",
          isMobile ? "h-[90vh]" : "w-full sm:max-w-[600px]",
        )}
      >
        {doc && <FichaBody doc={doc} onOpenDoc={onOpenDoc} />}
      </SheetContent>
    </Sheet>
  );
}

function FichaBody({ doc, onOpenDoc }: { doc: Documento; onOpenDoc?: (id: string) => void }) {
  const { data: empresas = [] } = useEmpresas();
  const { data: areas = [] } = useAreas();
  const empresa = empresas.find((e) => e.id === doc.empresa_id)?.nombre ?? "—";
  const area = areas.find((a) => a.id === doc.area_id)?.nombre ?? "—";

  return (
    <>
      <SheetHeader className="mb-4">
        <div className="font-mono text-lg font-semibold text-primary">{doc.codigo}</div>
        <SheetTitle className="text-base">{doc.nombre}</SheetTitle>
        <div className="flex flex-wrap gap-2 pt-1">
          <StatusBadge cfg={DOC_ESTATUS[doc.estatus]} />
          <OutlineBadge>{DOC_TIPO_LABEL[doc.tipo] ?? doc.tipo}</OutlineBadge>
        </div>
      </SheetHeader>

      <Tabs defaultValue="detalle">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="detalle">Detalle</TabsTrigger>
          <TabsTrigger value="rel">Relacionados</TabsTrigger>
          <TabsTrigger value="hist">Versiones</TabsTrigger>
          <TabsTrigger value="cargos">Cargos</TabsTrigger>
        </TabsList>

        <TabsContent value="detalle" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Info label="Empresa" value={empresa} />
            <Info label="Área" value={area} />
            <Info label="Versión" value={doc.version ?? "—"} />
            <Info label="Fecha última revisión" value={doc.fecha_ultima_edicion ?? "—"} />
            <Info label="Nivel" value={doc.nivel ? NIVEL_LABEL[doc.nivel] ?? String(doc.nivel) : "—"} />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Aplicación</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {(doc.aplicacion_arr ?? [doc.aplicacion].filter(Boolean) as string[]).length === 0 ? (
                  <span className="text-foreground">—</span>
                ) : (
                  (doc.aplicacion_arr ?? [doc.aplicacion].filter(Boolean) as string[]).map((a) => (
                    <OutlineBadge key={a}>{APLICACION_LABEL[a] ?? a}</OutlineBadge>
                  ))
                )}
              </div>
            </div>
          </div>
          {doc.comentarios && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Comentarios
              </p>
              <p className="mt-1 text-sm text-foreground">{doc.comentarios}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            {doc.archivo_url && (
              <>
                <SignedFileLink bucket="documentos" path={doc.archivo_url} className={buttonVariants({ size: "sm", variant: "outline" })}>
                  <FileText className="mr-1.5 h-4 w-4" /> Ver PDF
                </SignedFileLink>
                <SignedFileLink bucket="documentos" path={doc.archivo_url} download className={buttonVariants({ size: "sm", variant: "outline" })}>
                  <Download className="mr-1.5 h-4 w-4" /> Descargar
                </SignedFileLink>
              </>
            )}
            {doc.drive_url && (
              <Button asChild size="sm" variant="outline">
                <a href={doc.drive_url} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-1.5 h-4 w-4" /> Abrir en Drive
                </a>
              </Button>
            )}
            {!doc.archivo_url && !doc.drive_url && (
              <p className="text-sm text-muted-foreground">
                Sin archivo asociado. Edita el documento para subir un PDF o agregar un enlace.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rel" className="pt-4">
          <RelacionesTab doc={doc} onOpenDoc={onOpenDoc} />
        </TabsContent>

        <TabsContent value="hist" className="pt-4">
          <VersionesTab doc={doc} />
        </TabsContent>

        <TabsContent value="cargos" className="pt-4">
          <CargosTab doc={doc} />
        </TabsContent>
      </Tabs>
    </>
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

function RelacionesTab({ doc, onOpenDoc }: { doc: Documento; onOpenDoc?: (id: string) => void }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [tipo, setTipo] = useState("referencia");
  const [destinoId, setDestinoId] = useState<string>("");

  const { data: relaciones = [] } = useQuery({
    queryKey: ["doc-rel", doc.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos_relaciones")
        .select("id, tipo_relacion, documento_origen_id, documento_destino_id")
        .or(`documento_origen_id.eq.${doc.id},documento_destino_id.eq.${doc.id}`);
      if (error) throw error;
      return data as Array<{
        id: string;
        tipo_relacion: string;
        documento_origen_id: string;
        documento_destino_id: string;
      }>;
    },
  });

  const { data: docs = [] } = useQuery({
    queryKey: ["doc-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("id, codigo, nombre")
        .neq("estatus", "eliminado")
        .order("codigo");
      if (error) throw error;
      return data as { id: string; codigo: string; nombre: string }[];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("documentos_relaciones").insert({
        documento_origen_id: doc.id,
        documento_destino_id: destinoId,
        tipo_relacion: tipo,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doc-rel", doc.id] });
      toast.success("Relación agregada");
      setAdding(false);
      setDestinoId("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documentos_relaciones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doc-rel", doc.id] }),
  });

  const docMap = new Map(docs.map((d) => [d.id, d]));

  return (
    <div className="space-y-3">
      {relaciones.length === 0 && (
        <p className="text-sm text-muted-foreground">Sin relaciones registradas.</p>
      )}
      {relaciones.map((r) => {
        const isOrigen = r.documento_origen_id === doc.id;
        const otherId = isOrigen ? r.documento_destino_id : r.documento_origen_id;
        const other = docMap.get(otherId) ?? { id: otherId, codigo: "—", nombre: "Documento" };
        return (
          <div key={r.id} className="flex items-center justify-between rounded-md border border-border p-2">
            <button
              className="flex items-center gap-2 text-left"
              onClick={() => onOpenDoc?.(other.id)}
            >
              <OutlineBadge>{REL_LABELS[r.tipo_relacion]}</OutlineBadge>
              <span className="font-mono text-xs text-primary">{other.codigo}</span>
              <span className="text-sm text-foreground">{other.nombre}</span>
            </button>
            <Button variant="ghost" size="icon" onClick={() => del.mutate(r.id)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}

      {adding ? (
        <div className="space-y-2 rounded-md border border-border p-3">
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(REL_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={destinoId} onValueChange={setDestinoId}>
            <SelectTrigger><SelectValue placeholder="Documento…" /></SelectTrigger>
            <SelectContent>
              {docs.filter((d) => d.id !== doc.id).map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.codigo} — {d.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => add.mutate()} disabled={!destinoId || add.isPending}>
              Agregar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAdding(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Agregar relación
        </Button>
      )}
    </div>
  );
}

function VersionesTab({ doc }: { doc: Documento }) {
  const qc = useQueryClient();
  const { perfil } = useAuth();
  const [adding, setAdding] = useState(false);
  const [version, setVersion] = useState("");
  const [notas, setNotas] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data: versiones = [] } = useQuery({
    queryKey: ["doc-ver", doc.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos_versiones")
        .select("id, version_numero, fecha, archivo_url, notas_cambio, created_at")
        .eq("documento_id", doc.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Array<{
        id: string; version_numero: string; fecha: string | null;
        archivo_url: string | null; notas_cambio: string | null; created_at: string;
      }>;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      let archivo_url: string | null = null;
      if (file) {
        const path = `${sanitizeSegment(doc.codigo)}/v${sanitizeSegment(version || "x")}-${Date.now()}.pdf`;
        const res = await uploadFile("documentos", path, file);
        archivo_url = res.path;
      }
      const { error } = await supabase.from("documentos_versiones").insert({
        documento_id: doc.id,
        version_numero: version,
        notas_cambio: notas || null,
        archivo_url,
        creado_por: perfil?.id ?? null,
      });
      if (error) throw error;
      await supabase
        .from("documentos")
        .update({ version, fecha_ultima_edicion: new Date().toISOString().slice(0, 10), ...(archivo_url ? { archivo_url } : {}) })
        .eq("id", doc.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doc-ver", doc.id] });
      qc.invalidateQueries({ queryKey: ["documentos"] });
      toast.success("Versión registrada");
      setAdding(false);
      setVersion(""); setNotas(""); setFile(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <ol className="relative space-y-4 border-l border-border pl-5">
        {versiones.map((v, i) => (
          <li key={v.id} className="relative">
            <span className="absolute -left-[1.45rem] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-foreground">v{v.version_numero}</span>
              {i === 0 && <OutlineBadge>Actual</OutlineBadge>}
              <span className="text-xs text-muted-foreground">{v.fecha ?? v.created_at?.slice(0, 10)}</span>
            </div>
            {v.notas_cambio && <p className="text-sm text-muted-foreground">{v.notas_cambio}</p>}
            {v.archivo_url && (
              <SignedFileLink bucket="documentos" path={v.archivo_url} className="text-xs text-primary underline">
                Descargar PDF
              </SignedFileLink>
            )}
          </li>
        ))}
        {versiones.length === 0 && (
          <li className="text-sm text-muted-foreground">Sin versiones anteriores registradas.</li>
        )}
      </ol>

      {adding ? (
        <div className="space-y-2 rounded-md border border-border p-3">
          <div className="space-y-1.5"><Label>Número de versión</Label>
            <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="2.0" />
          </div>
          <div className="space-y-1.5"><Label>Notas de cambio</Label>
            <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>
          <div className="space-y-1.5"><Label>PDF (opcional)</Label>
            <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => add.mutate()} disabled={!version.trim() || add.isPending}>Registrar</Button>
            <Button size="sm" variant="outline" onClick={() => setAdding(false)}>Cancelar</Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Registrar nueva versión
        </Button>
      )}
    </div>
  );
}

function CargosTab({ doc }: { doc: Documento }) {
  const qc = useQueryClient();
  const { data: cargos = [] } = useCargos();
  const { data: asignados = [] } = useQuery({
    queryKey: ["doc-cargos", doc.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos_cargos")
        .select("id, cargo_id")
        .eq("documento_id", doc.id);
      if (error) throw error;
      return data as { id: string; cargo_id: string }[];
    },
  });

  const toggle = useMutation({
    mutationFn: async (cargoId: string) => {
      const existing = asignados.find((a) => a.cargo_id === cargoId);
      if (existing) {
        const { error } = await supabase.from("documentos_cargos").delete().eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("documentos_cargos")
          .insert({ documento_id: doc.id, cargo_id: cargoId });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doc-cargos", doc.id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const asignadosSet = new Set(asignados.map((a) => a.cargo_id));

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Selecciona los cargos a los que aplica este documento.</p>
      <div className="flex flex-wrap gap-2">
        {cargos.filter((c) => c.activo).map((c) => {
          const on = asignadosSet.has(c.id);
          return (
            <button
              key={c.id}
              onClick={() => toggle.mutate(c.id)}
              className={
                on
                  ? "rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground"
                  : "rounded-md border border-border px-3 py-1 text-sm text-muted-foreground hover:border-primary/50"
              }
            >
              {c.nombre}
            </button>
          );
        })}
      </div>
    </div>
  );
}
