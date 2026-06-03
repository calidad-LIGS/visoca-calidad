import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEmpresas, useAreas, useUsuarios } from "@/hooks/useCatalogos";
import { codigoAuditoria } from "@/lib/auditoriaUtils";
import { upsertEvento } from "@/lib/calendarSync";
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

export function AuditoriaFormDialog({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const { perfil } = useAuth();
  const { data: empresas = [] } = useEmpresas();
  const { data: areas = [] } = useAreas();
  const { data: usuarios = [] } = useUsuarios();

  const [tipo, setTipo] = useState("interna");
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [numero, setNumero] = useState(1);
  const [fIni, setFIni] = useState("");
  const [fFin, setFFin] = useState("");
  const [empSel, setEmpSel] = useState<string[]>([]);
  const [cert, setCert] = useState("iso_9001");
  const [certOtra, setCertOtra] = useState("");
  const [auditor, setAuditor] = useState("");
  const [areaSel, setAreaSel] = useState<string[]>([]);
  const [modalidad, setModalidad] = useState("mixta");
  const [notas, setNotas] = useState("");

  useEffect(() => {
    if (open) {
      setTipo("interna"); setAnio(new Date().getFullYear()); setNumero(1);
      setFIni(""); setFFin(""); setEmpSel([]); setCert("iso_9001"); setCertOtra("");
      setAuditor(""); setAreaSel([]); setModalidad("mixta"); setNotas("");
    }
  }, [open]);

  const toggle = (arr: string[], set: (v: string[]) => void, id: string) =>
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const create = useMutation({
    mutationFn: async () => {
      const codigo = codigoAuditoria(tipo, anio, numero);
      const { data, error } = await supabase.from("auditorias").insert({
        tipo, anio, numero_auditoria: numero, codigo_auditoria: codigo,
        fecha_inicio: fIni || null, fecha_fin: fFin || null,
        empresa_ids: empSel, certificacion: cert, certificacion_otra: cert === "otra" ? certOtra : null,
        auditor_lider_id: auditor || null, areas_auditadas: areaSel, modalidad,
        estatus: "programada", notas: notas || null, creado_por: perfil?.id ?? null,
      }).select("id, codigo_auditoria").single();
      if (error) throw error;
      if (fIni) {
        await upsertEvento({
          tipo: "auditoria", titulo: codigo, descripcion: notas,
          fecha_inicio: fIni, fecha_fin: fFin || null,
          referencia_id: data.id, referencia_tabla: "auditorias",
          empresa_id: empSel[0] ?? null,
        });
      }
      return data.codigo_auditoria;
    },
    onSuccess: (codigo) => {
      qc.invalidateQueries({ queryKey: ["auditorias"] });
      toast.success(`${codigo} creada`);
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reglaMsg =
    tipo === "interna" && numero === 1 ? "Primera auditoría del año: abarca todas las áreas de LIGS Group."
    : tipo === "interna" && numero === 2 ? "Segunda auditoría del año: exclusiva Agencia Aduanal."
    : null;

  const auditores = usuarios; // idealmente filtrados por rol auditor_interno

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Nueva Auditoría</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="interna">Interna</SelectItem>
                <SelectItem value="externa">Externa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5"><Label>Año</Label><Input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label># Auditoría</Label><Input type="number" min={1} value={numero} onChange={(e) => setNumero(Number(e.target.value))} /></div>
          </div>
          {reglaMsg && <p className="rounded-md border border-primary/30 bg-primary/10 p-2 text-xs text-primary sm:col-span-2">{reglaMsg}</p>}
          <div className="space-y-1.5"><Label>Fecha inicio</Label><Input type="date" value={fIni} onChange={(e) => setFIni(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Fecha fin</Label><Input type="date" value={fFin} onChange={(e) => setFFin(e.target.value)} /></div>

          <div className="space-y-1.5 sm:col-span-2"><Label>Empresas auditadas</Label>
            <div className="flex flex-wrap gap-2">
              {empresas.map((e) => (
                <Chip key={e.id} on={empSel.includes(e.id)} onClick={() => toggle(empSel, setEmpSel, e.id)}>{e.clave}</Chip>
              ))}
            </div>
          </div>

          <div className="space-y-1.5"><Label>Certificación</Label>
            <Select value={cert} onValueChange={setCert}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="iso_9001">ISO 9001</SelectItem>
                <SelectItem value="ola_oea">OLA/OEA</SelectItem>
                <SelectItem value="ambas">Ambas</SelectItem>
                <SelectItem value="otra">Otra</SelectItem>
              </SelectContent>
            </Select>
            {cert === "otra" && <Input className="mt-2" value={certOtra} onChange={(e) => setCertOtra(e.target.value)} placeholder="Especifica" />}
          </div>
          <div className="space-y-1.5"><Label>Auditor líder</Label>
            <Select value={auditor} onValueChange={setAuditor}>
              <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
              <SelectContent>
                {auditores.map((u) => (<SelectItem key={u.id} value={u.id}>{u.nombre_completo}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2"><Label>Áreas a auditar</Label>
            <div className="flex flex-wrap gap-2">
              {areas.map((a) => (
                <Chip key={a.id} on={areaSel.includes(a.id)} onClick={() => toggle(areaSel, setAreaSel, a.id)}>{a.nombre}</Chip>
              ))}
            </div>
          </div>

          <div className="space-y-1.5"><Label>Modalidad</Label>
            <Select value={modalidad} onValueChange={setModalidad}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="documental">Documental</SelectItem>
                <SelectItem value="entrevista">Entrevista</SelectItem>
                <SelectItem value="mixta">Mixta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Notas</Label><Textarea value={notas} onChange={(e) => setNotas(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => create.mutate()} disabled={create.isPending}>Crear auditoría</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={on ? "rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground" : "rounded-md border border-border px-3 py-1 text-sm text-muted-foreground hover:border-primary/50"}>
      {children}
    </button>
  );
}
