-- ===== Funciones de ayuda (SECURITY DEFINER) =====
CREATE OR REPLACE FUNCTION public.is_quality_staff(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = _uid AND role IN ('analista','jefe_calidad','gerente_calidad'));
$$;

CREATE OR REPLACE FUNCTION public.is_quality_or_auditor(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = _uid AND role IN ('analista','jefe_calidad','gerente_calidad','auditor_interno'));
$$;

CREATE OR REPLACE FUNCTION public.is_quality_manager(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = _uid AND role IN ('jefe_calidad','gerente_calidad'));
$$;

-- ===== Escritura = personal de calidad (analista/jefe/gerente) =====
DROP POLICY IF EXISTS doc_insert ON public.documentos;
CREATE POLICY doc_insert ON public.documentos FOR INSERT TO authenticated
  WITH CHECK (public.is_quality_staff(auth.uid()));
DROP POLICY IF EXISTS doc_update ON public.documentos;
CREATE POLICY doc_update ON public.documentos FOR UPDATE TO authenticated
  USING (public.is_quality_staff(auth.uid())) WITH CHECK (public.is_quality_staff(auth.uid()));

DROP POLICY IF EXISTS docver_insert ON public.documentos_versiones;
CREATE POLICY docver_insert ON public.documentos_versiones FOR INSERT TO authenticated
  WITH CHECK (public.is_quality_staff(auth.uid()));

DROP POLICY IF EXISTS docrel_insert ON public.documentos_relaciones;
CREATE POLICY docrel_insert ON public.documentos_relaciones FOR INSERT TO authenticated
  WITH CHECK (public.is_quality_staff(auth.uid()));

DROP POLICY IF EXISTS doccar_insert ON public.documentos_cargos;
CREATE POLICY doccar_insert ON public.documentos_cargos FOR INSERT TO authenticated
  WITH CHECK (public.is_quality_staff(auth.uid()));

DROP POLICY IF EXISTS proy_insert ON public.proyectos;
CREATE POLICY proy_insert ON public.proyectos FOR INSERT TO authenticated
  WITH CHECK (public.is_quality_staff(auth.uid()));
DROP POLICY IF EXISTS proy_update ON public.proyectos;
CREATE POLICY proy_update ON public.proyectos FOR UPDATE TO authenticated
  USING (public.is_quality_staff(auth.uid())) WITH CHECK (public.is_quality_staff(auth.uid()));

DROP POLICY IF EXISTS act_insert ON public.actividades;
CREATE POLICY act_insert ON public.actividades FOR INSERT TO authenticated
  WITH CHECK (public.is_quality_staff(auth.uid()));
DROP POLICY IF EXISTS act_update ON public.actividades;
CREATE POLICY act_update ON public.actividades FOR UPDATE TO authenticated
  USING (public.is_quality_staff(auth.uid())) WITH CHECK (public.is_quality_staff(auth.uid()));

DROP POLICY IF EXISTS sub_insert ON public.subtareas;
CREATE POLICY sub_insert ON public.subtareas FOR INSERT TO authenticated
  WITH CHECK (public.is_quality_staff(auth.uid()));
DROP POLICY IF EXISTS sub_update ON public.subtareas;
CREATE POLICY sub_update ON public.subtareas FOR UPDATE TO authenticated
  USING (public.is_quality_staff(auth.uid())) WITH CHECK (public.is_quality_staff(auth.uid()));

-- ===== Escritura = personal de calidad + auditor interno =====
DROP POLICY IF EXISTS aud_insert ON public.auditorias;
CREATE POLICY aud_insert ON public.auditorias FOR INSERT TO authenticated
  WITH CHECK (public.is_quality_or_auditor(auth.uid()));
DROP POLICY IF EXISTS aud_update ON public.auditorias;
CREATE POLICY aud_update ON public.auditorias FOR UPDATE TO authenticated
  USING (public.is_quality_or_auditor(auth.uid())) WITH CHECK (public.is_quality_or_auditor(auth.uid()));

DROP POLICY IF EXISTS hall_insert ON public.auditoria_hallazgos;
CREATE POLICY hall_insert ON public.auditoria_hallazgos FOR INSERT TO authenticated
  WITH CHECK (public.is_quality_or_auditor(auth.uid()));
DROP POLICY IF EXISTS hall_update ON public.auditoria_hallazgos;
CREATE POLICY hall_update ON public.auditoria_hallazgos FOR UPDATE TO authenticated
  USING (public.is_quality_or_auditor(auth.uid())) WITH CHECK (public.is_quality_or_auditor(auth.uid()));

DROP POLICY IF EXISTS acta_insert ON public.auditoria_actas;
CREATE POLICY acta_insert ON public.auditoria_actas FOR INSERT TO authenticated
  WITH CHECK (public.is_quality_or_auditor(auth.uid()));
DROP POLICY IF EXISTS acta_update ON public.auditoria_actas;
CREATE POLICY acta_update ON public.auditoria_actas FOR UPDATE TO authenticated
  USING (public.is_quality_or_auditor(auth.uid())) WITH CHECK (public.is_quality_or_auditor(auth.uid()));

DROP POLICY IF EXISTS pnc_insert ON public.pnc;
CREATE POLICY pnc_insert ON public.pnc FOR INSERT TO authenticated
  WITH CHECK (public.is_quality_or_auditor(auth.uid()));
DROP POLICY IF EXISTS pnc_update ON public.pnc;
CREATE POLICY pnc_update ON public.pnc FOR UPDATE TO authenticated
  USING (public.is_quality_or_auditor(auth.uid())) WITH CHECK (public.is_quality_or_auditor(auth.uid()));

DROP POLICY IF EXISTS pncacc_insert ON public.pnc_acciones;
CREATE POLICY pncacc_insert ON public.pnc_acciones FOR INSERT TO authenticated
  WITH CHECK (public.is_quality_or_auditor(auth.uid()));
DROP POLICY IF EXISTS pncacc_update ON public.pnc_acciones;
CREATE POLICY pncacc_update ON public.pnc_acciones FOR UPDATE TO authenticated
  USING (public.is_quality_or_auditor(auth.uid())) WITH CHECK (public.is_quality_or_auditor(auth.uid()));

DROP POLICY IF EXISTS pncev_insert ON public.pnc_evidencias;
CREATE POLICY pncev_insert ON public.pnc_evidencias FOR INSERT TO authenticated
  WITH CHECK (public.is_quality_or_auditor(auth.uid()));

DROP POLICY IF EXISTS pncplan_insert ON public.pnc_plan_mejora;
CREATE POLICY pncplan_insert ON public.pnc_plan_mejora FOR INSERT TO authenticated
  WITH CHECK (public.is_quality_or_auditor(auth.uid()));
DROP POLICY IF EXISTS pncplan_update ON public.pnc_plan_mejora;
CREATE POLICY pncplan_update ON public.pnc_plan_mejora FOR UPDATE TO authenticated
  USING (public.is_quality_or_auditor(auth.uid())) WITH CHECK (public.is_quality_or_auditor(auth.uid()));

DROP POLICY IF EXISTS pnchist_insert ON public.pnc_historial_estatus;
CREATE POLICY pnchist_insert ON public.pnc_historial_estatus FOR INSERT TO authenticated
  WITH CHECK (public.is_quality_or_auditor(auth.uid()));

DROP POLICY IF EXISTS ev_insert ON public.eventos_calendario;
CREATE POLICY ev_insert ON public.eventos_calendario FOR INSERT TO authenticated
  WITH CHECK (public.is_quality_or_auditor(auth.uid()));
DROP POLICY IF EXISTS ev_update ON public.eventos_calendario;
CREATE POLICY ev_update ON public.eventos_calendario FOR UPDATE TO authenticated
  USING (public.is_quality_or_auditor(auth.uid())) WITH CHECK (public.is_quality_or_auditor(auth.uid()));

DROP POLICY IF EXISTS bia_insert ON public.busquedas_ia;
CREATE POLICY bia_insert ON public.busquedas_ia FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id AND public.is_quality_or_auditor(auth.uid()));

-- ===== Eliminaci\u00f3n = solo jefe/gerente de calidad =====
DROP POLICY IF EXISTS docrel_delete ON public.documentos_relaciones;
CREATE POLICY docrel_delete ON public.documentos_relaciones FOR DELETE TO authenticated
  USING (public.is_quality_manager(auth.uid()));

DROP POLICY IF EXISTS doccar_delete ON public.documentos_cargos;
CREATE POLICY doccar_delete ON public.documentos_cargos FOR DELETE TO authenticated
  USING (public.is_quality_manager(auth.uid()));

DROP POLICY IF EXISTS pncacc_delete ON public.pnc_acciones;
CREATE POLICY pncacc_delete ON public.pnc_acciones FOR DELETE TO authenticated
  USING (public.is_quality_manager(auth.uid()));

DROP POLICY IF EXISTS pncev_delete ON public.pnc_evidencias;
CREATE POLICY pncev_delete ON public.pnc_evidencias FOR DELETE TO authenticated
  USING (public.is_quality_manager(auth.uid()));

DROP POLICY IF EXISTS hall_delete ON public.auditoria_hallazgos;
CREATE POLICY hall_delete ON public.auditoria_hallazgos FOR DELETE TO authenticated
  USING (public.is_quality_manager(auth.uid()));

DROP POLICY IF EXISTS act_delete ON public.actividades;
CREATE POLICY act_delete ON public.actividades FOR DELETE TO authenticated
  USING (public.is_quality_manager(auth.uid()));

DROP POLICY IF EXISTS sub_delete ON public.subtareas;
CREATE POLICY sub_delete ON public.subtareas FOR DELETE TO authenticated
  USING (public.is_quality_manager(auth.uid()));

-- Eliminaci\u00f3n de eventos de calendario: se mantiene a nivel operativo
-- porque la sincronizaci\u00f3n autom\u00e1tica con actividades los gestiona.
DROP POLICY IF EXISTS ev_delete ON public.eventos_calendario;
CREATE POLICY ev_delete ON public.eventos_calendario FOR DELETE TO authenticated
  USING (public.is_quality_or_auditor(auth.uid()));

-- ===== Cat\u00e1logos / configuraci\u00f3n = solo jefe/gerente =====
DROP POLICY IF EXISTS "gestion areas" ON public.areas;
CREATE POLICY "gestion areas" ON public.areas FOR ALL TO authenticated
  USING (public.is_quality_manager(auth.uid())) WITH CHECK (public.is_quality_manager(auth.uid()));

DROP POLICY IF EXISTS "gestion area_empresas" ON public.area_empresas;
CREATE POLICY "gestion area_empresas" ON public.area_empresas FOR ALL TO authenticated
  USING (public.is_quality_manager(auth.uid())) WITH CHECK (public.is_quality_manager(auth.uid()));

DROP POLICY IF EXISTS "gestion cargos" ON public.cargos;
CREATE POLICY "gestion cargos" ON public.cargos FOR ALL TO authenticated
  USING (public.is_quality_manager(auth.uid())) WITH CHECK (public.is_quality_manager(auth.uid()));

DROP POLICY IF EXISTS "gerente write empresas" ON public.empresas;
CREATE POLICY "gerente write empresas" ON public.empresas FOR ALL TO authenticated
  USING (public.is_quality_manager(auth.uid())) WITH CHECK (public.is_quality_manager(auth.uid()));

DROP POLICY IF EXISTS "gerente write config" ON public.configuracion_alertas;
CREATE POLICY "gerente write config" ON public.configuracion_alertas FOR ALL TO authenticated
  USING (public.is_quality_manager(auth.uid())) WITH CHECK (public.is_quality_manager(auth.uid()));

DROP POLICY IF EXISTS org_insert ON public.org_config;
CREATE POLICY org_insert ON public.org_config FOR INSERT TO authenticated
  WITH CHECK (public.is_quality_manager(auth.uid()));
DROP POLICY IF EXISTS org_update ON public.org_config;
CREATE POLICY org_update ON public.org_config FOR UPDATE TO authenticated
  USING (public.is_quality_manager(auth.uid())) WITH CHECK (public.is_quality_manager(auth.uid()));