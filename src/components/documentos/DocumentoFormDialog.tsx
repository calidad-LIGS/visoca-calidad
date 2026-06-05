import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEmpresas, useAreas } from "@/hooks/useCatalogos";
import { uploadFile, sanitizeSegment } from "@/lib/storage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export interface Documento {
  id: string;
  empresa_id: string | null;
  tipo: string;
  codigo: string;
  nombre: string;
  area_id: string | null;
  version: string | null;
  fecha_ultima_edicion: string | null;
  estatus: string;
  origen: string | null;
  nivel: number | null;
  aplicacion: string | null;
  aplicacion_arr: string[] | null;
  comentarios: string | null;
  archivo_url: string | null;
  drive_url: string | null;
}

const TIPOS = ["politica", "proceso", "manual", "formato", "acta"];
const ESTATUS = ["vigente", "sustituido", "eliminado"];

const NIVELES = [
  { value: 1, label: "N1 — Política" },
  { value: 2, label: "N2 — Manual" },
  { value: 3, label: "N3 — Proceso" },
  { value: 4, label: "N4 — Formato" },
  { value: 5, label: "N5 — Acta" },
];

const TIPO_NIVEL: Record<string, number> = {
  politica: 1, manual: 2, proceso: 3, formato: 4, acta: 5,
};

const APLICACIONES_OPTS = [
  { value: "iso_9001", label: "ISO 9001:2015" },
  { value: "ola_oea", label: "OLA/OEA" },
  { value: "interno", label: "Interno" },
];

export function DocumentoFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Documento | null;
}) {
  const qc = useQueryClient();
  const { perfil } = useAuth();
  const { data: empresas = [] } = useEmpresas();
  const { data: areas = [] } = useAreas();

  const [form, setForm] = useState<Partial<Documento>>({});
  const [aplicaciones, setAplicaciones] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      setForm(
        editing ?? {
          tipo: "proceso",
          estatus: "vigente",
          nivel: 3,
          version: "1.0",
        },
      );
      setAplicaciones(
        editing?.aplicacion_arr ?? [editing?.aplicacion].filter(Boolean) as string[],
      );
      setFile(null);
    }
  }, [open, editing]);

  const set = (k: keyof Documento, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  // Auto-seleccionar nivel según el tipo del documento
  useEffect(() => {
    if (form.tipo && TIPO_NIVEL[form.tipo]) set("nivel", TIPO_NIVEL[form.tipo]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.tipo]);

  const save = useMutation({
    mutationFn: async () => {
      let archivo_url = form.archivo_url ?? null;
      if (file) {
        const empresaClave =
          empresas.find((e) => e.id === form.empresa_id)?.clave ?? "GEN";
        const path = `${sanitizeSegment(empresaClave)}/${sanitizeSegment(
          form.codigo ?? "doc",
        )}/${sanitizeSegment(form.version ?? "1.0")}.pdf`;
        const res = await uploadFile("documentos", path, file);
        archivo_url = res.path;
      }
      const payload = {
        empresa_id: form.empresa_id ?? null,
        tipo: form.tipo!,
        codigo: form.codigo!,
        nombre: form.nombre!,
        area_id: form.area_id ?? null,
        version: form.version ?? "1.0",
        fecha_ultima_edicion: form.fecha_ultima_edicion ?? new Date().toISOString().slice(0, 10),
        estatus: form.estatus!,
        nivel: form.nivel ?? 3,
        aplicacion_arr: aplicaciones,
        comentarios: form.comentarios ?? null,
        archivo_url,
        drive_url: form.drive_url ?? null,
      };
      if (editing) {
        const { error } = await supabase
          .from("documentos")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("documentos")
          .insert({ ...payload, created_by: perfil?.id ?? null });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documentos"] });
      toast.success(editing ? "Documento actualizado" : "Documento creado");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const valid = form.codigo?.trim() && form.nombre?.trim() && form.tipo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar documento" : "Nuevo documento"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
          <Field label="Código">
            <Input
              className="font-mono"
              value={form.codigo ?? ""}
              onChange={(e) => set("codigo", e.target.value)}
              placeholder="LIGS-CAL-04"
            />
          </Field>
          <Field label="Tipo">
            <Sel value={form.tipo} onChange={(v) => set("tipo", v)} options={TIPOS} />
          </Field>
          <Field label="Nombre" full>
            <Input value={form.nombre ?? ""} onChange={(e) => set("nombre", e.target.value)} />
          </Field>
          <Field label="Empresa">
            <Sel
              value={form.empresa_id ?? undefined}
              onChange={(v) => set("empresa_id", v)}
              options={empresas.map((e) => ({ value: e.id, label: e.nombre }))}
            />
          </Field>
          <Field label="Área">
            <Sel
              value={form.area_id ?? undefined}
              onChange={(v) => set("area_id", v)}
              options={areas.map((a) => ({ value: a.id, label: a.nombre }))}
            />
          </Field>
          <Field label="Versión">
            <Input value={form.version ?? ""} onChange={(e) => set("version", e.target.value)} />
          </Field>
          <Field label="Fecha últ. edición">
            <Input
              type="date"
              value={form.fecha_ultima_edicion?.slice(0, 10) ?? ""}
              onChange={(e) => set("fecha_ultima_edicion", e.target.value)}
            />
          </Field>
          <Field label="Estatus">
            <Sel value={form.estatus} onChange={(v) => set("estatus", v)} options={ESTATUS} />
          </Field>
          <Field label="Origen">
            <Sel value={form.origen ?? undefined} onChange={(v) => set("origen", v)} options={ORIGENES} />
          </Field>
          <Field label="Nivel (1-5)">
            <Input
              type="number"
              min={1}
              max={5}
              value={form.nivel ?? 3}
              onChange={(e) => set("nivel", Number(e.target.value))}
            />
          </Field>
          <Field label="Aplicación">
            <Sel
              value={form.aplicacion ?? undefined}
              onChange={(v) => set("aplicacion", v)}
              options={APLICACIONES}
            />
          </Field>
          <Field label="Comentarios" full>
            <Textarea
              value={form.comentarios ?? ""}
              onChange={(e) => set("comentarios", e.target.value)}
            />
          </Field>
          <Field label="Archivo PDF">
            <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </Field>
          <Field label="URL Google Drive">
            <Input value={form.drive_url ?? ""} onChange={(e) => set("drive_url", e.target.value)} placeholder="https://drive.google.com/..." />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => save.mutate()} disabled={!valid || save.isPending}>
            {save.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Sel({
  value,
  onChange,
  options,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  options: (string | { value: string; label: string })[];
}) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Selecciona…" />
      </SelectTrigger>
      <SelectContent>
        {opts.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
