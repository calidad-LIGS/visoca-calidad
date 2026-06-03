import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export const ROLE_LABELS: Record<AppRole, string> = {
  gerente_calidad: "Gerente de Calidad",
  jefe_calidad: "Jefe de Calidad",
  analista: "Analista",
  auditor_interno: "Auditor Interno",
};

export const ROLE_OPTIONS: { value: AppRole; label: string }[] = (
  Object.keys(ROLE_LABELS) as AppRole[]
).map((value) => ({ value, label: ROLE_LABELS[value] }));
