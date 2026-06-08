REVOKE EXECUTE ON FUNCTION public.is_quality_staff(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_quality_or_auditor(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_quality_manager(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_quality_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_quality_or_auditor(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_quality_manager(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;