-- This migration previously seeded a specific administrator account by email and UUID.
-- The seed data (real email address and user UUID) has been removed because storing
-- PII / privileged-account identifiers in version control is a security risk.
--
-- Administrator accounts are now provisioned exclusively through the in-app
-- "Usuarios" admin flow (createUsuario server function, restricted to the
-- gerente_calidad role) or via the Supabase dashboard.
--
-- This file is intentionally a no-op to preserve migration history ordering.
select 1;
