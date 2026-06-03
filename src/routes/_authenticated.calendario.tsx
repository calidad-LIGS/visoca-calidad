import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common/ComingSoon";

export const Route = createFileRoute("/_authenticated/calendario")({
  head: () => ({ meta: [{ title: "Calendario — VISOCA-Calidad" }] }),
  component: () => (
    <ComingSoon breadcrumb="Calendario" title="Calendario" />
  ),
});
