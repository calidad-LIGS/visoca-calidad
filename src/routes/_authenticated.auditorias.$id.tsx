import { createFileRoute } from "@tanstack/react-router";
import { AuditoriaDetail } from "@/components/auditorias/AuditoriaDetail";

export const Route = createFileRoute("/_authenticated/auditorias/$id")({
  head: () => ({
    meta: [
      { title: "Detalle de Auditoría — VISOCA-Calidad" },
      { name: "description", content: "Revise el detalle completo de una auditoría: alcance, hallazgos, responsables y avance del plan de acción en VISOCA." },
      { property: "og:title", content: "Detalle de Auditoría — VISOCA-Calidad" },
      { property: "og:description", content: "Revise el detalle completo de una auditoría: alcance, hallazgos y avance del plan de acción en VISOCA." },
    ],
    links: [{ rel: "canonical", href: "/auditorias" }],
  }),
  component: DetailRoute,
});

function DetailRoute() {
  const { id } = Route.useParams();
  return <AuditoriaDetail id={id} />;
}
