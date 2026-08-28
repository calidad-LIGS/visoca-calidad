import { ColaboradoresTab } from "@/components/configuracion/ColaboradoresTab";
import { PageHeader } from "@/components/layout/PageHeader";

export function ColaboradoresView() {
  return (
    <>
      <PageHeader
        breadcrumb="Sistema"
        title="Colaboradores"
        subtitle="Gestión de colaboradores externos y sus documentos asignados"
      />
      <ColaboradoresTab />
    </>
  );
}
