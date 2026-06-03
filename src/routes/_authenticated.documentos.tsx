import { createFileRoute } from "@tanstack/react-router";
import { DocumentosView } from "@/components/documentos/DocumentosView";

export const Route = createFileRoute("/_authenticated/documentos")({
  head: () => ({
    meta: [
      { title: "Documentos — VISOCA-Calidad" },
      { name: "description", content: "Gestione el maestro de documentos del sistema de calidad: procedimientos, instructivos, registros y control de versiones en VISOCA." },
      { property: "og:title", content: "Documentos — VISOCA-Calidad" },
      { property: "og:description", content: "Gestione el maestro de documentos del sistema de calidad: procedimientos, instructivos y control de versiones en VISOCA." },
    ],
    links: [{ rel: "canonical", href: "/documentos" }],
  }),
  component: DocumentosView,
});
