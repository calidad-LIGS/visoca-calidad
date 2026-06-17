import { createFileRoute } from "@tanstack/react-router";
import { DocumentosView } from "@/components/documentos/DocumentosView";

export const Route = createFileRoute("/_authenticated/documentos/")({
  head: () => ({
    meta: [
      { title: "Documentos — VISOCA-Calidad" },
      { name: "description", content: "Gestione los documentos del sistema de calidad de VISOCA de LIGS Group: procedimientos, formatos, instructivos y registros." },
      { property: "og:title", content: "Documentos — VISOCA-Calidad" },
      { property: "og:description", content: "Gestione los documentos del sistema de calidad de VISOCA de LIGS Group." },
    ],
    links: [{ rel: "canonical", href: "/documentos" }],
  }),
  component: DocumentosView,
});
