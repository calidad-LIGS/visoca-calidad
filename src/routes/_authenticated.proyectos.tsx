import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common/ComingSoon";

export const Route = createFileRoute("/_authenticated/proyectos")({
  head: () => ({ meta: [{ title: "Proyectos — VISOCA-Calidad" }] }),
  component: () => <ComingSoon breadcrumb="Proyectos" title="Proyectos" />,
});
