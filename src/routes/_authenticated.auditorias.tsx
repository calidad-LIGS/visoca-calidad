import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common/ComingSoon";

export const Route = createFileRoute("/_authenticated/auditorias")({
  head: () => ({ meta: [{ title: "Auditorías — VISOCA-Calidad" }] }),
  component: () => <ComingSoon breadcrumb="Auditorías" title="Auditorías" />,
});
