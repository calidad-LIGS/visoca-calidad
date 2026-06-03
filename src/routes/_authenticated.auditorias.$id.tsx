import { createFileRoute } from "@tanstack/react-router";
import { AuditoriaDetail } from "@/components/auditorias/AuditoriaDetail";

export const Route = createFileRoute("/_authenticated/auditorias/$id")({
  head: () => ({ meta: [{ title: "Detalle de Auditoría — VISOCA-Calidad" }] }),
  component: DetailRoute,
});

function DetailRoute() {
  const { id } = Route.useParams();
  return <AuditoriaDetail id={id} />;
}
