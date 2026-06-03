import { createFileRoute } from "@tanstack/react-router";
import { CalendarView } from "@/components/calendario/CalendarView";

export const Route = createFileRoute("/_authenticated/calendario")({
  head: () => ({
    meta: [
      { title: "Calendario — VISOCA-Calidad" },
      { name: "description", content: "Calendario de eventos del sistema de calidad: auditorías, vencimientos de documentos, capacitaciones y fechas críticas de LIGS Group." },
      { property: "og:title", content: "Calendario — VISOCA-Calidad" },
      { property: "og:description", content: "Calendario de eventos del sistema de calidad: auditorías, vencimientos y fechas críticas de LIGS Group." },
    ],
    links: [{ rel: "canonical", href: "/calendario" }],
  }),
  component: CalendarView,
});
