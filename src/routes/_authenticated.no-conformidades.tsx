import { createFileRoute } from "@tanstack/react-router";
import { PncView } from "@/components/pnc/PncView";

export const Route = createFileRoute("/_authenticated/no-conformidades")({
  head: () => ({
    meta: [
      { title: "No Conformidades — VISOCA-Calidad" },
      { name: "description", content: "Registre, clasifique y dé seguimiento a productos no conformes (PNC). Gestione acciones correctivas y evidencias en VISOCA de LIGS Group." },
      { property: "og:title", content: "No Conformidades — VISOCA-Calidad" },
      { property: "og:description", content: "Registre, clasifique y dé seguimiento a productos no conformes y acciones correctivas en VISOCA." },
    ],
    links: [{ rel: "canonical", href: "/no-conformidades" }],
  }),
  component: PncView,
});
