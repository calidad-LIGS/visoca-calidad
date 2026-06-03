import { createFileRoute } from "@tanstack/react-router";
import { ProyectosView } from "@/components/proyectos/ProyectosView";

export const Route = createFileRoute("/_authenticated/proyectos")({
  head: () => ({
    meta: [
      { title: "Proyectos — VISOCA-Calidad" },
      { name: "description", content: "Administre proyectos de mejora de calidad: planificación, seguimiento de avance, tareas y responsables en el sistema VISOCA de LIGS Group." },
      { property: "og:title", content: "Proyectos — VISOCA-Calidad" },
      { property: "og:description", content: "Administre proyectos de mejora de calidad: planificación, seguimiento de avance y tareas en VISOCA." },
    ],
    links: [{ rel: "canonical", href: "/proyectos" }],
  }),
  component: ProyectosView,
});
