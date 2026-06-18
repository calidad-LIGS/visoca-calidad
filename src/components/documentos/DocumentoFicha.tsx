import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Download, ExternalLink, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEmpresas, useAreas, useCargos } from "@/hooks/useCatalogos";
import { uploadFile, sanitizeSegment, safeExternalUrl } from "@/lib/storage";
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
            {safeExternalUrl(doc.drive_url) && (
              <Button asChild size="sm" variant="outline">
                <a href={safeExternalUrl(doc.drive_url)!} target="_blank" rel="noreferrer">
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

        const REL_INVERSE: Record<string, string> = {
          padre: "Hijo de",
          hijo: "Padre de",
          sustituto: "Sustituido por",
          sustituido_por: "Sustituye a",
          referencia: "Referenciado por",
          referencia_mutua: "Se mencionan mutuamente",
        };

        return (
          <div key={r.id} className="flex items-center justify-between rounded-md border border-border p-2">
            <button
              className="flex items-center gap-2 text-left"
              onClick={() => onOpenDoc?.(other.id)}
            >
              <OutlineBadge>
                {isOrigen
                  ? (REL_LABELS[r.tipo_relacion] ?? r.tipo_relacion)
                  : (REL_INVERSE[r.tipo_relacion] ?? r.tipo_relacion)}
              </OutlineBadge>
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

  const { data: areas = [] } = useAreas();

  const { data: cargos = [] } = useCargos();

  // Cargar vinculaciones existentes del documento (cargo + área)

  const { data: asignados = [] } = useQuery({

    queryKey: ["doc-cargos", doc.id],

    queryFn: async () => {

      const { data, error } = await supabase

        .from("documentos_cargos")

        .select("id, cargo_id, area_id")

        .eq("documento_id", doc.id)

        .order("area_id");

      if (error) throw error;

      return data as { id: string; cargo_id: string; area_id: string | null }[];

    },

  });

  // Cargar cargo_areas para saber qué cargos pertenecen a cada área

  const { data: cargoAreas = [] } = useQuery({

    queryKey: ["cargo-areas-all"],

    queryFn: async () => {

      const { data } = await supabase

        .from("cargo_areas")

        .select("cargo_id, area_id");

      return (data ?? []) as { cargo_id: string; area_id: string }[];

    },

    staleTime: 300_000,

  });

  // Estado del formulario para agregar nueva vinculación

  const [areaSelec, setAreaSelec] = useState("");

  const [cargoSelec, setCargoSelec] = useState("");

  const [busqArea, setBusqArea] = useState("");

  const [busqCargo, setBusqCargo] = useState("");

  const [showAreaList, setShowAreaList] = useState(false);

  const [showCargoList, setShowCargoList] = useState(false);

  // Cargos disponibles para el área seleccionada

  const cargoIdsEnArea = cargoAreas

    .filter((ca) => ca.area_id === areaSelec)

    .map((ca) => ca.cargo_id);

  const cargosEnArea = cargos.filter(

    (c) => c.activo && cargoIdsEnArea.includes(c.id)

  );

  const areasFiltradas = busqArea

    ? areas.filter((a) => a.nombre.toLowerCase().includes(busqArea.toLowerCase()))

    : areas;

  const cargosFiltrados = busqCargo

    ? cargosEnArea.filter((c) => c.nombre.toLowerCase().includes(busqCargo.toLowerCase()))

    : cargosEnArea;

  // Agregar vinculación

  const agregar = useMutation({

    mutationFn: async () => {

      if (!areaSelec || !cargoSelec) throw new Error("Selecciona área y cargo");

      const { error } = await supabase.from("documentos_cargos").insert({

        documento_id: doc.id,

        cargo_id: cargoSelec,

        area_id: areaSelec,

      });

      if (error) throw error;

    },

    onSuccess: () => {

      qc.invalidateQueries({ queryKey: ["doc-cargos", doc.id] });

      toast.success("Cargo vinculado");

      setAreaSelec("");

      setCargoSelec("");

      setBusqArea("");

      setBusqCargo("");

    },

    onError: (e: Error) => toast.error(e.message),

  });

  // Eliminar vinculación

  const eliminar = useMutation({

    mutationFn: async (id: string) => {

      const { error } = await supabase.from("documentos_cargos").delete().eq("id", id);

      if (error) throw error;

    },

    onSuccess: () => qc.invalidateQueries({ queryKey: ["doc-cargos", doc.id] }),

    onError: (e: Error) => toast.error(e.message),

  });

  // Helpers de nombre

  const areaNombre = (id: string | null) => areas.find((a) => a.id === id)?.nombre ?? "Sin área";

  const cargoNombre = (id: string) => cargos.find((c) => c.id === id)?.nombre ?? "—";

  // Agrupar vinculaciones por área para mostrar

  const porArea = asignados.reduce<Record<string, typeof asignados>>((acc, a) => {

    const key = a.area_id ?? "__sin_area__";

    if (!acc[key]) acc[key] = [];

    acc[key].push(a);

    return acc;

  }, {});

  const areaSelecNombre = areas.find((a) => a.id === areaSelec)?.nombre ?? "";

  const cargoSelecNombre = cargos.find((c) => c.id === cargoSelec)?.nombre ?? "";

  return (

    <div className="space-y-4">

      <p className="text-sm text-muted-foreground">

        Vincula cargos por área. El mismo cargo en áreas distintas se registra como puesto independiente.

      </p>

      {/* Lista de vinculaciones existentes agrupadas por área */}

      {asignados.length > 0 ? (

        <div className="space-y-3">

          {Object.entries(porArea).map(([areaId, items]) => (

            <div key={areaId} className="rounded-md border border-border overflow-hidden">

              <div className="bg-elevated px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">

                {areaNombre(areaId === "__sin_area__" ? null : areaId)}

              </div>

              <div className="divide-y divide-border">

                {items.map((a) => (

                  <div key={a.id} className="flex items-center justify-between px-3 py-2">

                    <span className="text-sm text-foreground">{cargoNombre(a.cargo_id)}</span>

                    <Button

                      variant="ghost"

                      size="icon"

                      className="h-7 w-7 text-muted-foreground hover:text-danger"

                      onClick={() => eliminar.mutate(a.id)}

                    >

                      <X className="h-3.5 w-3.5" />

                    </Button>

                  </div>

                ))}

              </div>

            </div>

          ))}

        </div>

      ) : (

        <p className="text-sm text-muted-foreground italic">Sin cargos vinculados aún.</p>

      )}

      {/* Formulario para agregar nueva vinculación */}

      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-3">

        <p className="text-xs font-semibold text-primary">Agregar vinculación</p>

        {/* Selector de Área */}

        <div className="space-y-1">

          <label className="text-xs font-medium text-muted-foreground">Área</label>

          <div className="relative">

            <Input

              value={showAreaList ? busqArea : areaSelecNombre}

              onChange={(e) => { setBusqArea(e.target.value); setShowAreaList(true); }}

              onFocus={() => setShowAreaList(true)}

              placeholder="Buscar área..."

              className="text-sm h-8"

            />

            {showAreaList && (

              <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-surface shadow-lg max-h-40 overflow-y-auto">

                {areasFiltradas.map((a) => (

                  <button

                    key={a.id}

                    className="w-full px-3 py-2 text-left text-sm hover:bg-elevated text-foreground"

                    onMouseDown={(e) => e.preventDefault()}

                    onClick={() => {

                      setAreaSelec(a.id);

                      setCargoSelec("");

                      setBusqArea("");

                      setBusqCargo("");

                      setShowAreaList(false);

                    }}

                  >

                    {a.nombre}

                  </button>

                ))}

                {areasFiltradas.length === 0 && (

                  <p className="px-3 py-2 text-xs text-muted-foreground">Sin resultados</p>

                )}

              </div>

            )}

          </div>

        </div>

        {/* Selector de Cargo (solo si hay área seleccionada) */}

        {areaSelec && (

          <div className="space-y-1">

            <label className="text-xs font-medium text-muted-foreground">

              Cargo en {areaSelecNombre}

            </label>

            {cargosEnArea.length === 0 ? (

              <p className="text-xs text-muted-foreground italic">

                No hay cargos vinculados a esta área. Ve a Configuración → Cargos para agregarlos.

              </p>

            ) : (

              <div className="relative">

                <Input

                  value={showCargoList ? busqCargo : cargoSelecNombre}

                  onChange={(e) => { setBusqCargo(e.target.value); setShowCargoList(true); }}

                  onFocus={() => setShowCargoList(true)}

                  placeholder="Buscar cargo..."

                  className="text-sm h-8"

                />

                {showCargoList && (

                  <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-surface shadow-lg max-h-40 overflow-y-auto">

                    {cargosFiltrados.map((c) => (

                      <button

                        key={c.id}

                        className="w-full px-3 py-2 text-left text-sm hover:bg-elevated text-foreground"

                        onMouseDown={(e) => e.preventDefault()}

                        onClick={() => {

                          setCargoSelec(c.id);

                          setBusqCargo("");

                          setShowCargoList(false);

                        }}

                      >

                        {c.nombre}

                      </button>

                    ))}

                    {cargosFiltrados.length === 0 && (

                      <p className="px-3 py-2 text-xs text-muted-foreground">Sin resultados</p>

                    )}

                  </div>

                )}

              </div>

            )}

          </div>

        )}

        <Button

          size="sm"

          onClick={() => agregar.mutate()}

          disabled={!areaSelec || !cargoSelec || agregar.isPending}

          className="w-full"

        >

          {agregar.isPending ? "Vinculando..." : "Vincular cargo"}

        </Button>

      </div>

    </div>

  );

}

