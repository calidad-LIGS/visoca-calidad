import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { buscarDocumentosIA, type BusquedaResultado } from "@/lib/busqueda.functions";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BuscadorIA({
  open, onOpenChange, onSelect,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect?: (docId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<BusquedaResultado | null>(null);
  const fn = useServerFn(buscarDocumentosIA);

  const search = useMutation({
    mutationFn: async () => await fn({ data: { query } }),
    onSuccess: (r) => setResult(r),
    onError: (e: Error) => {
      const msg = /429/.test(e.message)
        ? "Límite de solicitudes alcanzado. Intenta de nuevo en unos momentos."
        : /402/.test(e.message)
        ? "Créditos de IA agotados. Contacta al administrador."
        : e.message;
      toast.error(msg);
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setResult(null); setQuery(""); } }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Búsqueda inteligente
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: ¿Qué proceso aplica para el manejo de quejas?"
            onKeyDown={(e) => { if (e.key === "Enter" && query.trim().length > 1) search.mutate(); }}
          />
          <Button disabled={query.trim().length < 2 || search.isPending} onClick={() => search.mutate()}>
            {search.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {search.isPending && (
          <p className="py-8 text-center text-sm text-muted-foreground">Analizando documentos con IA…</p>
        )}

        {result && !search.isPending && (
          <div className="space-y-3">
            <p className="rounded-md border border-border bg-card p-3 text-sm text-foreground">{result.resumen}</p>
            {result.documentos.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No se encontraron documentos relevantes.</p>
            ) : (
              <ul className="space-y-2">
                {result.documentos.map((d) => (
                  <li key={d.id}>
                    <button
                      onClick={() => { onSelect?.(d.id); onOpenChange(false); }}
                      className="flex w-full items-start gap-3 rounded-md border border-border bg-card p-3 text-left transition-colors hover:border-primary/60"
                    >
                      <span className="mt-0.5 shrink-0 rounded bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">{d.codigo}</span>
                      <span className="flex-1">
                        <span className="block text-sm font-medium text-foreground">{d.nombre}</span>
                        <span className="block text-xs text-muted-foreground">{d.motivo}</span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-accent">{d.relevancia}%</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
