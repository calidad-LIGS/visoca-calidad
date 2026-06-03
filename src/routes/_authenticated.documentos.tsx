import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common/ComingSoon";

export const Route = createFileRoute("/_authenticated/documentos")({
  head: () => ({ meta: [{ title: "Documentos — VISOCA-Calidad" }] }),
  component: () => (
    <ComingSoon breadcrumb="Documentos" title="Control de Documentos" />
  ),
});
