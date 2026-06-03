import { createFileRoute } from "@tanstack/react-router";
import { AuditoriasView } from "@/components/auditorias/AuditoriasView";

export const Route = createFileRoute("/_authenticated/auditorias")({
  head: () => ({
    meta: [
      { title: "Auditorías — VISOCA-Calidad" },
      { name: "description", content: "Programa y registre auditorías internas y externas. Gestione hallazgos, planes de acción y actas de cierre en VISOCA." },
      { property: "og:title", content: "Auditorías — VISOCA-Calidad" },
      { property: "og:description", content: "Programa y registre auditorías internas y externas. Gestione hallazgos y planes de acción en VISOCA." },
    ],
    links: [{ rel: "canonical", href: "/auditorias" }],
  }),
  component: AuditoriasView,
});
