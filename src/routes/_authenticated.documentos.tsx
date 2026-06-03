import { createFileRoute } from "@tanstack/react-router";
import { DocumentosView } from "@/components/documentos/DocumentosView";

export const Route = createFileRoute("/_authenticated/documentos")({
  head: () => ({ meta: [{ title: "Documentos — VISOCA-Calidad" }] }),
  component: DocumentosView,
});
