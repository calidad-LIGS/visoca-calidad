import { createFileRoute } from "@tanstack/react-router";
import { CalendarView } from "@/components/calendario/CalendarView";

export const Route = createFileRoute("/_authenticated/calendario")({
  head: () => ({ meta: [{ title: "Calendario — VISOCA-Calidad" }] }),
  component: CalendarView,
});
