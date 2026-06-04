import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, Building2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { uploadFile, sanitizeSegment } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OrgConfig {
  id: string;
  nombre_completo: string;
  logo_url: string | null;
}

export function DatosEmpresaTab() {
  const qc = useQueryClient();
  const { perfil } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nombre, setNombre] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: config } = useQuery({
    queryKey: ["org_config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_config")
        .select("id, nombre_completo, logo_url")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as OrgConfig | null;
    },
  });

  useEffect(() => {
    if (config) setNombre(config.nombre_completo);
  }, [config]);

  const save = useMutation({
    mutationFn: async (patch: { nombre_completo?: string; logo_url?: string }) => {
      if (config?.id) {
        const { error } = await supabase
          .from("org_config")
          .update({ ...patch, updated_by: perfil?.id ?? null })
          .eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("org_config").insert({
          nombre_completo: patch.nombre_completo ?? "LIGS Group",
          logo_url: patch.logo_url ?? null,
          updated_by: perfil?.id ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org_config"] });
      toast.success("Datos de la empresa actualizados");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { path } = await uploadFile("org-assets", `logo/${Date.now()}_${sanitizeSegment(file.name)}`, file);
      await save.mutateAsync({ logo_url: getPublicUrl("org-assets", path) });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h3 className="font-display text-base font-semibold text-foreground">Identidad institucional</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre completo de la organización</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="LIGS Group" />
          </div>

          <div className="space-y-1.5">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface">
                {config?.logo_url ? (
                  <img src={config.logo_url} alt="Logo de la organización" className="h-full w-full object-contain" />
                ) : (
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
              <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
                {uploading ? "Subiendo…" : "Subir logo"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">PNG o JPG, máximo 10MB. Se usa en encabezados y reportes.</p>
          </div>

          <Button
            disabled={!nombre.trim() || save.isPending}
            onClick={() => save.mutate({ nombre_completo: nombre.trim() })}
          >
            {save.isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
  );
}
