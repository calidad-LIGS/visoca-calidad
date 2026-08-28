import { createFileRoute } from "@tanstack/react-router";
import { ColaboradoresView } from "@/components/colaboradores/ColaboradoresView";

export const Route = createFileRoute("/_authenticated/colaboradores")({
  component: ColaboradoresView,
});
