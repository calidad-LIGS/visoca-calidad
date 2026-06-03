import { createFileRoute } from "@tanstack/react-router";
import { DocumentosRed } from "@/components/documentos/DocumentosRed";

export const Route = createFileRoute("/_authenticated/documentos/red")({
  head: () => ({ meta: [{ title: "Red de Documentos — VISOCA-Calidad" }] }),
  component: DocumentosRed,
});
