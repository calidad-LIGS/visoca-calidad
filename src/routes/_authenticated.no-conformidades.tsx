import { createFileRoute } from "@tanstack/react-router";
import { PncView } from "@/components/pnc/PncView";

export const Route = createFileRoute("/_authenticated/no-conformidades")({
  head: () => ({ meta: [{ title: "No Conformidades — VISOCA-Calidad" }] }),
  component: PncView,
});
