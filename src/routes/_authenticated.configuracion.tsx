import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsuariosTab } from "@/components/configuracion/UsuariosTab";
import { EmpresasTab } from "@/components/configuracion/EmpresasTab";
import { AreasTab } from "@/components/configuracion/AreasTab";
import { CargosTab } from "@/components/configuracion/CargosTab";
import { AlertasTab } from "@/components/configuracion/AlertasTab";

export const Route = createFileRoute("/_authenticated/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — VISOCA-Calidad" }] }),
  component: ConfiguracionPage,
});

function ConfiguracionPage() {
  const { isGerente, loading } = useAuth();

  if (loading) return null;

  if (!isGerente) {
    return (
      <>
        <PageHeader breadcrumb="Configuración" title="Configuración" />
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
          <ShieldAlert className="mb-3 h-10 w-10 text-warning" />
          <h2 className="font-display text-lg font-semibold text-foreground">
            Acceso restringido
          </h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Solo el Gerente de Calidad puede acceder a la configuración del sistema.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        breadcrumb="Sistema"
        title="Configuración"
        subtitle="Catálogos maestros y parámetros del sistema (M7)"
      />

      <Tabs defaultValue="usuarios">
        <TabsList className="mb-6">
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="empresas">Empresas</TabsTrigger>
          <TabsTrigger value="areas">Áreas</TabsTrigger>
          <TabsTrigger value="cargos">Cargos</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          <UsuariosTab />
        </TabsContent>
        <TabsContent value="empresas">
          <EmpresasTab />
        </TabsContent>
        <TabsContent value="areas">
          <AreasTab />
        </TabsContent>
        <TabsContent value="cargos">
          <CargosTab />
        </TabsContent>
        <TabsContent value="alertas">
          <AlertasTab />
        </TabsContent>
      </Tabs>
    </>
  );
}
