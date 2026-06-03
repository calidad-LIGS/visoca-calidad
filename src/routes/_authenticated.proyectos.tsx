import { createFileRoute } from "@tanstack/react-router";
import { ProyectosView } from "@/components/proyectos/ProyectosView";

export const Route = createFileRoute("/_authenticated/proyectos")({
  head: () => ({ meta: [{ title: "Proyectos — VISOCA-Calidad" }] }),
  component: ProyectosView,
});
