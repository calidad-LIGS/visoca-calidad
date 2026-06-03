import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/components/auth/AuthProvider";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Calendar,
  BarChart2,
  FileText,
  ClipboardCheck,
  AlertTriangle,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [{ title: "Dashboard — VISOCA-Calidad" }],
  }),
  component: DashboardPage,
});

const MODULES = [
  { to: "/calendario", label: "Calendario", icon: Calendar, desc: "Eventos y vencimientos" },
  { to: "/proyectos", label: "Proyectos", icon: BarChart2, desc: "Cronogramas de trabajo" },
  { to: "/documentos", label: "Documentos", icon: FileText, desc: "Lista maestra documental" },
  { to: "/auditorias", label: "Auditorías", icon: ClipboardCheck, desc: "Programa de auditorías" },
  { to: "/no-conformidades", label: "No Conformidades", icon: AlertTriangle, desc: "Producto no conforme" },
];

function DashboardPage() {
  const { perfil } = useAuth();
  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <>
      <PageHeader
        breadcrumb="Inicio"
        title={`${saludo}${perfil ? `, ${perfil.nombre_completo.split(" ")[0]}` : ""}`}
        subtitle="Sistema de gestión de calidad · LIGS Group"
      />

      <div className="mb-6 rounded-lg border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Fundación operativa
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Autenticación, navegación y catálogos están activos. El tablero de
          indicadores se habilitará en la fase de Dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.to}
              to={m.to}
              className="group rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/60"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display font-semibold text-foreground">{m.label}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{m.desc}</p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
