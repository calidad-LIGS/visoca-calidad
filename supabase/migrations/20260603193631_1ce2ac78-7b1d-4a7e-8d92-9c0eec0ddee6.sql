
-- ENUM de roles
CREATE TYPE public.app_role AS ENUM ('gerente_calidad','jefe_calidad','analista','auditor_interno');

-- Función updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

-- EMPRESAS
CREATE TABLE public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  clave TEXT NOT NULL CHECK (clave IN ('GAP','LIGS','TV','CORP','OTRA')),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresas TO authenticated;
GRANT ALL ON public.empresas TO service_role;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- AREAS
CREATE TABLE public.areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.areas TO authenticated;
GRANT ALL ON public.areas TO service_role;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

-- AREA <-> EMPRESA (multiselect)
CREATE TABLE public.area_empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  UNIQUE (area_id, empresa_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.area_empresas TO authenticated;
GRANT ALL ON public.area_empresas TO service_role;
ALTER TABLE public.area_empresas ENABLE ROW LEVEL SECURITY;

-- CARGOS
CREATE TABLE public.cargos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cargos TO authenticated;
GRANT ALL ON public.cargos TO service_role;
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;

-- USUARIOS (perfil)
CREATE TABLE public.usuarios (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuarios TO authenticated;
GRANT ALL ON public.usuarios TO service_role;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- USER_ROLES
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- CONFIGURACION ALERTAS
CREATE TABLE public.configuracion_alertas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dias_alerta_pnc INT NOT NULL DEFAULT 3,
  dias_alerta_documentos_sin_revision INT NOT NULL DEFAULT 30,
  dias_sin_auditoria INT NOT NULL DEFAULT 180,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracion_alertas TO authenticated;
GRANT ALL ON public.configuracion_alertas TO service_role;
ALTER TABLE public.configuracion_alertas ENABLE ROW LEVEL SECURITY;

-- has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- POLICIES: lectura para autenticados
CREATE POLICY "auth read empresas" ON public.empresas FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read areas" ON public.areas FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read area_empresas" ON public.area_empresas FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read cargos" ON public.cargos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read usuarios" ON public.usuarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read user_roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read config" ON public.configuracion_alertas FOR SELECT TO authenticated USING (true);

-- POLICIES: escritura empresas (gerente)
CREATE POLICY "gerente write empresas" ON public.empresas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'gerente_calidad')) WITH CHECK (public.has_role(auth.uid(),'gerente_calidad'));

-- POLICIES: escritura areas/cargos/area_empresas (gerente o jefe)
CREATE POLICY "gestion areas" ON public.areas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'gerente_calidad') OR public.has_role(auth.uid(),'jefe_calidad'))
  WITH CHECK (public.has_role(auth.uid(),'gerente_calidad') OR public.has_role(auth.uid(),'jefe_calidad'));
CREATE POLICY "gestion cargos" ON public.cargos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'gerente_calidad') OR public.has_role(auth.uid(),'jefe_calidad'))
  WITH CHECK (public.has_role(auth.uid(),'gerente_calidad') OR public.has_role(auth.uid(),'jefe_calidad'));
CREATE POLICY "gestion area_empresas" ON public.area_empresas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'gerente_calidad') OR public.has_role(auth.uid(),'jefe_calidad'))
  WITH CHECK (public.has_role(auth.uid(),'gerente_calidad') OR public.has_role(auth.uid(),'jefe_calidad'));

-- POLICIES: usuarios y roles (gerente). Usuario puede ver el suyo ya cubierto por read.
CREATE POLICY "gerente write usuarios" ON public.usuarios FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'gerente_calidad')) WITH CHECK (public.has_role(auth.uid(),'gerente_calidad'));
CREATE POLICY "gerente write roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'gerente_calidad')) WITH CHECK (public.has_role(auth.uid(),'gerente_calidad'));

-- POLICIES: config (gerente)
CREATE POLICY "gerente write config" ON public.configuracion_alertas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'gerente_calidad')) WITH CHECK (public.has_role(auth.uid(),'gerente_calidad'));

-- SEED empresas
INSERT INTO public.empresas (nombre, clave) VALUES
  ('GAP','GAP'),('LIGS','LIGS'),('TV','TV'),('CORP','CORP');

-- SEED areas
INSERT INTO public.areas (nombre) VALUES
  ('Administración'),('Aeropuerto'),('Almacén'),('Calidad'),('Comercial'),('Compras'),
  ('Contabilidad'),('Contraloría'),('Dirección'),('Facturación y Cobranza'),('Jurídico'),
  ('Mantenimiento'),('Marítimo'),('Monitoreo/Glosa'),('RRHH/Talento y Cultura'),
  ('Sistemas'),('Tesorería'),('Ligeros');

-- SEED cargos
INSERT INTO public.cargos (nombre) VALUES
  ('Director General'),('Gerente de Reingeniería y Calidad'),('Jefe de Calidad'),
  ('Analista de Calidad'),('Auxiliar de Calidad'),('Auditor Interno'),('Gerente de Área (genérico)');

-- SEED configuracion default (una fila)
INSERT INTO public.configuracion_alertas (dias_alerta_pnc, dias_alerta_documentos_sin_revision, dias_sin_auditoria)
VALUES (3, 30, 180);
