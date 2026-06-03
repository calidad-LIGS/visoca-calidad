import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip as RTooltip, CartesianGrid, Legend,
} from "recharts";
import {
  FileText, ClipboardCheck, AlertTriangle, BarChart2, CalendarClock, ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/common/KpiCard";
import { PNC_ESTATUS, PROY_ESTATUS, AUD_ESTATUS } from "@/lib/badges";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard — VISOCA-Calidad" },
      { name: "description", content: "Panel de control de VISOCA: indicadores de documentos, no conformidades, auditorías y proyectos de LIGS Group." },
      { property: "og:title", content: "Dashboard — VISOCA-Calidad" },
      { property: "og:description", content: "Panel de control de VISOCA: indicadores de documentos, no conformidades, auditorías y proyectos de LIGS Group." },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: DashboardPage,
});

interface Stats {
  docsVigentes: number;
  docsRevision: number;
  pncAbiertos: number;
  pncVencidos: number;
  pncPorEstatus: { name: string; value: number; color: string }[];
  audActivas: number;
  audPorEstatus: { name: string; value: number; color: string }[];
  proyActivos: number;
  proyAvance: { nombre: string; avance: number }[];
  proximos: { id: string; titulo: string; fecha: string; color: string }[];
}

function DashboardPage() {
  const { perfil } = useAuth();
  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  const { data } = useQuery<Stats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [docs, pnc, aud, proy, ev] = await Promise.all([
        supabase.from("documentos").select("estatus"),
        supabase.from("pnc").select("estatus, fecha_compromiso"),
        supabase.from("auditorias").select("estatus"),
        supabase.from("proyectos").select("nombre, estatus, avance_calculado, alta_prioridad"),
        supabase.from("eventos_calendario").select("id, titulo, fecha_inicio, color").gte("fecha_inicio", new Date().toISOString().slice(0, 10)).order("fecha_inicio").limit(6),
      ]);

      const docRows = docs.data ?? [];
      const pncRows = pnc.data ?? [];
      const audRows = aud.data ?? [];
      const proyRows = proy.data ?? [];

      const countBy = (rows: { estatus: string }[], cfgs: Record<string, { label: string; style: { backgroundColor?: string } }>) =>
        Object.entries(cfgs).map(([key, cfg]) => ({
          name: cfg.label,
          value: rows.filter((r) => r.estatus === key).length,
          color: cfg.style.backgroundColor ?? "#3B7DD8",
        })).filter((d) => d.value > 0);

      const now = new Date();
      return {
        docsVigentes: docRows.filter((d) => d.estatus === "vigente").length,
        docsRevision: docRows.filter((d) => d.estatus === "en_revision").length,
        pncAbiertos: pncRows.filter((p) => p.estatus !== "finalizado").length,
        pncVencidos: pncRows.filter((p) => p.estatus !== "finalizado" && p.fecha_compromiso && new Date(p.fecha_compromiso) < now).length,
        pncPorEstatus: countBy(pncRows, PNC_ESTATUS),
        audActivas: audRows.filter((a) => !["cerrada"].includes(a.estatus)).length,
        audPorEstatus: countBy(audRows, AUD_ESTATUS),
        proyActivos: proyRows.filter((p) => p.estatus === "en_proceso").length,
        proyAvance: proyRows
          .filter((p) => p.estatus !== "cancelado")
          .sort((a, b) => Number(b.alta_prioridad) - Number(a.alta_prioridad))
          .slice(0, 6)
          .map((p) => ({ nombre: p.nombre.length > 18 ? p.nombre.slice(0, 17) + "…" : p.nombre, avance: Math.round(p.avance_calculado ?? 0) })),
        proximos: (ev.data ?? []).map((e) => ({ id: e.id, titulo: e.titulo, fecha: e.fecha_inicio.slice(0, 10), color: e.color ?? "#555A6B" })),
      };
    },
    staleTime: 30_000,
  });

  return (
    <>
      <PageHeader
        breadcrumb="Inicio"
        title={`${saludo}${perfil ? `, ${perfil.nombre_completo.split(" ")[0]}` : ""}`}
        subtitle="Tablero de indicadores · LIGS Group"
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Link to="/documentos">
          <KpiCard label="Documentos vigentes" value={data?.docsVigentes ?? "—"} sub={`${data?.docsRevision ?? 0} en revisión`} accent="primary" icon={<FileText className="h-4 w-4" />} />
        </Link>
        <Link to="/no-conformidades">
          <KpiCard label="PNC abiertos" value={data?.pncAbiertos ?? "—"} sub={`${data?.pncVencidos ?? 0} vencidos`} accent={data && data.pncVencidos > 0 ? "danger" : "warning"} icon={<AlertTriangle className="h-4 w-4" />} />
        </Link>
        <Link to="/auditorias">
          <KpiCard label="Auditorías activas" value={data?.audActivas ?? "—"} accent="accent" icon={<ClipboardCheck className="h-4 w-4" />} />
        </Link>
        <Link to="/proyectos">
          <KpiCard label="Proyectos activos" value={data?.proyActivos ?? "—"} accent="primary" icon={<BarChart2 className="h-4 w-4" />} />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="No conformidades por estatus">
          {data && data.pncPorEstatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data.pncPorEstatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {data.pncPorEstatus.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <RTooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </ChartCard>

        <ChartCard title="Auditorías por estatus">
          {data && data.audPorEstatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data.audPorEstatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={2}>
                  {data.audPorEstatus.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <RTooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </ChartCard>

        <ChartCard title="Próximos vencimientos">
          {data && data.proximos.length > 0 ? (
            <ul className="space-y-2">
              {data.proximos.map((e) => (
                <li key={e.id} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: e.color }} />
                  <span className="flex-1 truncate text-sm text-foreground">{e.titulo}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{e.fecha}</span>
                </li>
              ))}
              <li className="pt-1">
                <Link to="/calendario" className="flex items-center gap-1 text-xs text-primary hover:underline">
                  Ver calendario <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          ) : (
            <div className="flex h-[240px] flex-col items-center justify-center text-sm text-muted-foreground">
              <CalendarClock className="mb-2 h-8 w-8" /> Sin vencimientos próximos.
            </div>
          )}
        </ChartCard>

        <ChartCard title="Avance de proyectos" className="lg:col-span-3">
          {data && data.proyAvance.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.proyAvance} margin={{ top: 8, right: 16, left: -8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E3347" />
                <XAxis dataKey="nombre" tick={{ fill: "#8B90A0", fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "#8B90A0", fontSize: 11 }} />
                <RTooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#ffffff08" }} />
                <Bar dataKey="avance" fill="#3B7DD8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </ChartCard>
      </div>
    </>
  );
}

const TOOLTIP_STYLE = {
  backgroundColor: "#1A1D27", border: "1px solid #2E3347", borderRadius: 8, color: "#fff", fontSize: 12,
};

function ChartCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-border bg-card p-5 ${className}`}>
      <h3 className="mb-3 font-display text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function Empty() {
  return (
    <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
      Sin datos para mostrar.
    </div>
  );
}
