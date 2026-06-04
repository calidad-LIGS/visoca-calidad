-- Restrict AI search history to its owner
DROP POLICY IF EXISTS bia_select ON public.busquedas_ia;
CREATE POLICY bia_select ON public.busquedas_ia
  FOR SELECT TO authenticated
  USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS bia_insert ON public.busquedas_ia;
CREATE POLICY bia_insert ON public.busquedas_ia
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id);

-- Restrict role visibility: each user can read only their own role rows.
-- Managers (gerente_calidad) keep full read/write via the existing ALL policy.
DROP POLICY IF EXISTS "auth read user_roles" ON public.user_roles;
CREATE POLICY "auth read user_roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Only managers may create/update organization configuration
DROP POLICY IF EXISTS org_insert ON public.org_config;
CREATE POLICY org_insert ON public.org_config
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'gerente_calidad'));

DROP POLICY IF EXISTS org_update ON public.org_config;
CREATE POLICY org_update ON public.org_config
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'gerente_calidad'))
  WITH CHECK (public.has_role(auth.uid(), 'gerente_calidad'));

-- Prevent forging PNC status-history entries: the author must be the current user
DROP POLICY IF EXISTS pnchist_insert ON public.pnc_historial_estatus;
CREATE POLICY pnchist_insert ON public.pnc_historial_estatus
  FOR INSERT TO authenticated
  WITH CHECK (cambiado_por = auth.uid());

-- Trigger helper functions should not be directly callable through the API
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_avance_proyecto() FROM PUBLIC, anon, authenticated;