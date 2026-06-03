import { createFileRoute } from "@tanstack/react-router";
import { AuditoriasView } from "@/components/auditorias/AuditoriasView";

export const Route = createFileRoute("/_authenticated/auditorias")({
  head: () => ({ meta: [{ title: "Auditorías — VISOCA-Calidad" }] }),
  component: AuditoriasView,
});
