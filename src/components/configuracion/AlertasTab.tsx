import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Config {
  id: string;
  dias_alerta_pnc: number;
  dias_alerta_documentos_sin_revision: number;
  dias_sin_auditoria: number;
}

export function AlertasTab() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState<Omit<Config, "id"> | null>(null);

  const { data: config } = useQuery({
    queryKey: ["config_alertas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracion_alertas")
        .select("id, dias_alerta_pnc, dias_alerta_documentos_sin_revision, dias_sin_auditoria")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Config | null;
    },
  });

  useEffect(() => {
    if (config) {
      setForm({
        dias_alerta_pnc: config.dias_alerta_pnc,
        dias_alerta_documentos_sin_revision: config.dias_alerta_documentos_sin_revision,
        dias_sin_auditoria: config.dias_sin_auditoria,
      });
    }
  }, [config]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form) return;
      const payload = { ...form, updated_at: new Date().toISOString(), updated_by: user?.id ?? null };
      if (config) {
        const { error } = await supabase
          .from("configuracion_alertas")
          .update(payload)
          .eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("configuracion_alertas").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["config_alertas"] });
      toast.success("Configuración guardada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!form) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  const fields: { key: keyof typeof form; label: string; hint: string }[] = [
    { key: "dias_alerta_pnc", label: "Días de alerta para PNC", hint: "Días antes del vencimiento para alertar un Producto No Conforme." },
    { key: "dias_alerta_documentos_sin_revision", label: "Días de documentos sin revisión", hint: "Umbral para marcar documentos que requieren revisión." },
    { key: "dias_sin_auditoria", label: "Días sin auditoría", hint: "Umbral de tiempo sin auditoría para generar aviso." },
  ];

  return (
    <div className="max-w-xl space-y-6">
      {fields.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <Label>{f.label}</Label>
          <Input
            type="number"
            min={0}
            value={form[f.key]}
            onChange={(e) =>
              setForm((prev) => prev && { ...prev, [f.key]: Number(e.target.value) })
            }
          />
          <p className="text-xs text-muted-foreground">{f.hint}</p>
        </div>
      ))}
      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        <Save className="mr-1.5 h-4 w-4" /> Guardar configuración
      </Button>
    </div>
  );
}
