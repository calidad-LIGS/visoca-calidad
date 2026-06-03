import { createFileRoute } from "@tanstack/react-router";
import { DocumentosRed } from "@/components/documentos/DocumentosRed";

export const Route = createFileRoute("/_authenticated/documentos/red")({
  head: () => ({
    meta: [
      { title: "Red de Documentos — VISOCA-Calidad" },
      { name: "description", content: "Visualice la red de interdependencias entre documentos del sistema de calidad y navegue las relaciones de VISOCA de LIGS Group." },
      { property: "og:title", content: "Red de Documentos — VISOCA-Calidad" },
      { property: "og:description", content: "Visualice la red de interdependencias entre documentos del sistema de calidad en VISOCA." },
    ],
    links: [{ rel: "canonical", href: "/documentos/red" }],
  }),
  component: DocumentosRed,
});
