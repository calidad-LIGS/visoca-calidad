import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Network } from "lucide-react";

// Implementado en Fase 7.
export function DocumentosRed() {
  return (
    <div>
      <PageHeader breadcrumb="Documentos / Red" title="Red de Documentos" />
      <EmptyState icon={<Network className="h-10 w-10" />} title="Grafo en preparación" />
    </div>
  );
}
