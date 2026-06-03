import type { ReactNode } from "react";
import { Construction } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

export function ComingSoon({
  title,
  breadcrumb,
  description,
  icon,
}: {
  title: string;
  breadcrumb?: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <>
      <PageHeader breadcrumb={breadcrumb} title={title} />
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/40 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon ?? <Construction className="h-8 w-8" />}
        </div>
        <h2 className="font-display text-xl font-semibold text-foreground">
          Próximamente
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {description ??
            "Este módulo se construirá en una fase posterior del sistema VISOCA-Calidad."}
        </p>
      </div>
    </>
  );
}
