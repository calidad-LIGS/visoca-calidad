import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common/ComingSoon";

export const Route = createFileRoute("/_authenticated/no-conformidades")({
  head: () => ({ meta: [{ title: "No Conformidades — VISOCA-Calidad" }] }),
  component: () => (
    <ComingSoon breadcrumb="Calidad" title="Producto No Conforme" />
  ),
});
