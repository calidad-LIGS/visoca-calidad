
-- ============ FASE 2: DOCUMENTOS (M4) ============
CREATE TABLE public.documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id),
  tipo text NOT NULL CHECK (tipo IN ('politica','proceso','manual','formato','acta')),
  codigo text NOT NULL,
  nombre text NOT NULL,
  area_id uuid REFERENCES public.areas(id),
  version text DEFAULT '1.0',
  fecha_ultima_edicion date DEFAULT now(),
  estatus text NOT NULL DEFAULT 'vigente' CHECK (estatus IN ('vigente','sustituido','eliminado','en_revision')),
  origen text DEFAULT 'interno' CHECK (origen IN ('iso','interno')),
  nivel int DEFAULT 3 CHECK (nivel BETWEEN 1 AND 5),
  aplicacion text DEFAULT 'interno' CHECK (aplicacion IN ('iso','ola_oea','interno','iso_ola')),
  comentarios text,
  archivo_url text,
  drive_url text,
  created_by uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.documentos TO authenticated;
GRANT ALL ON public.documentos TO service_role;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_select" ON public.documentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "doc_insert" ON public.documentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "doc_update" ON public.documentos FOR UPDATE TO authenticated USING (true);
CREATE TRIGGER trg_documentos_updated BEFORE UPDATE ON public.documentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.documentos_versiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id uuid NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  version_numero text NOT NULL,
  fecha date DEFAULT now(),
  archivo_url text,
  notas_cambio text,
  creado_por uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.documentos_versiones TO authenticated;
GRANT ALL ON public.documentos_versiones TO service_role;
ALTER TABLE public.documentos_versiones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "docver_select" ON public.documentos_versiones FOR SELECT TO authenticated USING (true);
CREATE POLICY "docver_insert" ON public.documentos_versiones FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.documentos_relaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_origen_id uuid NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  documento_destino_id uuid NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  tipo_relacion text NOT NULL CHECK (tipo_relacion IN ('padre','hijo','sustituto','sustituido_por','referencia')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.documentos_relaciones TO authenticated;
GRANT ALL ON public.documentos_relaciones TO service_role;
ALTER TABLE public.documentos_relaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "docrel_select" ON public.documentos_relaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "docrel_insert" ON public.documentos_relaciones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "docrel_delete" ON public.documentos_relaciones FOR DELETE TO authenticated USING (true);

CREATE TABLE public.documentos_cargos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id uuid NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  cargo_id uuid NOT NULL REFERENCES public.cargos(id) ON DELETE CASCADE,
  UNIQUE (documento_id, cargo_id)
);
GRANT SELECT, INSERT, DELETE ON public.documentos_cargos TO authenticated;
GRANT ALL ON public.documentos_cargos TO service_role;
ALTER TABLE public.documentos_cargos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doccar_select" ON public.documentos_cargos FOR SELECT TO authenticated USING (true);
CREATE POLICY "doccar_insert" ON public.documentos_cargos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "doccar_delete" ON public.documentos_cargos FOR DELETE TO authenticated USING (true);

-- ============ FASE 3: PNC (M6) ============
CREATE TABLE public.pnc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_anio text NOT NULL,
  descripcion text NOT NULL,
  estatus text NOT NULL DEFAULT 'pendiente' CHECK (estatus IN ('pendiente','en_proceso','verificacion','finalizado')),
  origen text NOT NULL CHECK (origen IN ('auditoria_interna','auditoria_externa','queja','multa','manual')),
  empresa_id uuid REFERENCES public.empresas(id),
  area_id uuid REFERENCES public.areas(id),
  proceso_documento_id uuid REFERENCES public.documentos(id),
  proceso_texto text,
  razon text CHECK (razon IN ('nc_mayor','nc_menor','oportunidad_mejora','omision_proceso','proceso_obsoleto')),
  metodologia text CHECK (metodologia IN ('cinco_porques','ishikawa','flujograma','na')),
  fecha_origen date NOT NULL DEFAULT now(),
  fecha_compromiso date,
  fecha_cierre date,
  solucion text,
  observaciones text,
  auditoria_id uuid,
  creado_por uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.pnc TO authenticated;
GRANT ALL ON public.pnc TO service_role;
ALTER TABLE public.pnc ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pnc_select" ON public.pnc FOR SELECT TO authenticated USING (true);
CREATE POLICY "pnc_insert" ON public.pnc FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pnc_update" ON public.pnc FOR UPDATE TO authenticated USING (true);
CREATE TRIGGER trg_pnc_updated BEFORE UPDATE ON public.pnc FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.pnc_plan_mejora (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pnc_id uuid NOT NULL REFERENCES public.pnc(id) ON DELETE CASCADE,
  analisis_causa_raiz text,
  fecha_inicio_plan date,
  fecha_implementacion date,
  kpi_dias int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.pnc_plan_mejora TO authenticated;
GRANT ALL ON public.pnc_plan_mejora TO service_role;
ALTER TABLE public.pnc_plan_mejora ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pncplan_select" ON public.pnc_plan_mejora FOR SELECT TO authenticated USING (true);
CREATE POLICY "pncplan_insert" ON public.pnc_plan_mejora FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pncplan_update" ON public.pnc_plan_mejora FOR UPDATE TO authenticated USING (true);
CREATE TRIGGER trg_pncplan_updated BEFORE UPDATE ON public.pnc_plan_mejora FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.pnc_acciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pnc_id uuid NOT NULL REFERENCES public.pnc(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  responsable_nombre text,
  responsable_usuario_id uuid REFERENCES public.usuarios(id),
  fecha_inicio date,
  fecha_fin date,
  estatus text NOT NULL DEFAULT 'pendiente' CHECK (estatus IN ('pendiente','en_proceso','completado')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pnc_acciones TO authenticated;
GRANT ALL ON public.pnc_acciones TO service_role;
ALTER TABLE public.pnc_acciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pncacc_select" ON public.pnc_acciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "pncacc_insert" ON public.pnc_acciones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pncacc_update" ON public.pnc_acciones FOR UPDATE TO authenticated USING (true);
CREATE POLICY "pncacc_delete" ON public.pnc_acciones FOR DELETE TO authenticated USING (true);

CREATE TABLE public.pnc_evidencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pnc_id uuid NOT NULL REFERENCES public.pnc(id) ON DELETE CASCADE,
  nombre_archivo text NOT NULL,
  archivo_url text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('plan_mejora','cierre','seguimiento')),
  subido_por uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.pnc_evidencias TO authenticated;
GRANT ALL ON public.pnc_evidencias TO service_role;
ALTER TABLE public.pnc_evidencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pncev_select" ON public.pnc_evidencias FOR SELECT TO authenticated USING (true);
CREATE POLICY "pncev_insert" ON public.pnc_evidencias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pncev_delete" ON public.pnc_evidencias FOR DELETE TO authenticated USING (true);

CREATE TABLE public.pnc_historial_estatus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pnc_id uuid NOT NULL REFERENCES public.pnc(id) ON DELETE CASCADE,
  estatus_anterior text,
  estatus_nuevo text NOT NULL,
  comentario text,
  cambiado_por uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.pnc_historial_estatus TO authenticated;
GRANT ALL ON public.pnc_historial_estatus TO service_role;
ALTER TABLE public.pnc_historial_estatus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pnchist_select" ON public.pnc_historial_estatus FOR SELECT TO authenticated USING (true);
CREATE POLICY "pnchist_insert" ON public.pnc_historial_estatus FOR INSERT TO authenticated WITH CHECK (true);

-- ============ FASE 4: AUDITORÍAS (M5) ============
CREATE TABLE public.auditorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('interna','externa')),
  anio int NOT NULL,
  numero_auditoria int NOT NULL,
  codigo_auditoria text NOT NULL,
  fecha_inicio date,
  fecha_fin date,
  empresa_ids text[] DEFAULT '{}',
  certificacion text CHECK (certificacion IN ('iso_9001','ola_oea','ambas','otra')),
  certificacion_otra text,
  auditor_lider_id uuid REFERENCES public.usuarios(id),
  areas_auditadas text[] DEFAULT '{}',
  modalidad text CHECK (modalidad IN ('documental','entrevista','mixta')),
  informe_url text,
  informe_drive_url text,
  estatus text NOT NULL DEFAULT 'programada' CHECK (estatus IN ('programada','en_ejecucion','con_hallazgos','en_seguimiento','cerrada')),
  notas text,
  creado_por uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.auditorias TO authenticated;
GRANT ALL ON public.auditorias TO service_role;
ALTER TABLE public.auditorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aud_select" ON public.auditorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "aud_insert" ON public.auditorias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "aud_update" ON public.auditorias FOR UPDATE TO authenticated USING (true);
CREATE TRIGGER trg_auditorias_updated BEFORE UPDATE ON public.auditorias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.auditoria_hallazgos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auditoria_id uuid NOT NULL REFERENCES public.auditorias(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('nc_mayor','nc_menor','oportunidad_mejora')),
  descripcion text NOT NULL,
  proceso_documento_id uuid REFERENCES public.documentos(id),
  proceso_texto text,
  area_id uuid REFERENCES public.areas(id),
  responsable_nombre text,
  responsable_usuario_id uuid REFERENCES public.usuarios(id),
  pnc_id uuid REFERENCES public.pnc(id),
  estatus text NOT NULL DEFAULT 'abierto' CHECK (estatus IN ('abierto','en_proceso','cerrado')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.auditoria_hallazgos TO authenticated;
GRANT ALL ON public.auditoria_hallazgos TO service_role;
ALTER TABLE public.auditoria_hallazgos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hall_select" ON public.auditoria_hallazgos FOR SELECT TO authenticated USING (true);
CREATE POLICY "hall_insert" ON public.auditoria_hallazgos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "hall_update" ON public.auditoria_hallazgos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "hall_delete" ON public.auditoria_hallazgos FOR DELETE TO authenticated USING (true);

ALTER TABLE public.pnc ADD CONSTRAINT pnc_auditoria_fk FOREIGN KEY (auditoria_id) REFERENCES public.auditorias(id);

CREATE TABLE public.auditoria_actas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auditoria_id uuid NOT NULL REFERENCES public.auditorias(id) ON DELETE CASCADE,
  departamento text,
  responsable_nombre text,
  fecha_acta date DEFAULT now(),
  contenido_json jsonb,
  pdf_url text,
  generado_por uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.auditoria_actas TO authenticated;
GRANT ALL ON public.auditoria_actas TO service_role;
ALTER TABLE public.auditoria_actas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acta_select" ON public.auditoria_actas FOR SELECT TO authenticated USING (true);
CREATE POLICY "acta_insert" ON public.auditoria_actas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "acta_update" ON public.auditoria_actas FOR UPDATE TO authenticated USING (true);

-- ============ FASE 5: PROYECTOS (M3) ============
CREATE TABLE public.proyectos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  objetivo text,
  empresa_id uuid REFERENCES public.empresas(id),
  area_id uuid REFERENCES public.areas(id),
  responsable_usuario_id uuid REFERENCES public.usuarios(id),
  responsable_nombre text,
  proceso_perteneciente text,
  tipo text DEFAULT 'interno' CHECK (tipo IN ('certificacion','interno')),
  alta_prioridad boolean DEFAULT false,
  fecha_inicio_plan date,
  fecha_fin_plan date,
  fecha_inicio_real date,
  fecha_fin_real date,
  avance_calculado numeric(5,2) DEFAULT 0,
  estatus text NOT NULL DEFAULT 'pendiente' CHECK (estatus IN ('pendiente','en_proceso','finalizado','cancelado')),
  revisado_at timestamptz,
  nota_observacion text,
  creado_por uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.proyectos TO authenticated;
GRANT ALL ON public.proyectos TO service_role;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proy_select" ON public.proyectos FOR SELECT TO authenticated USING (true);
CREATE POLICY "proy_insert" ON public.proyectos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "proy_update" ON public.proyectos FOR UPDATE TO authenticated USING (true);
CREATE TRIGGER trg_proyectos_updated BEFORE UPDATE ON public.proyectos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.actividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id uuid NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  responsable_usuario_id uuid REFERENCES public.usuarios(id),
  responsable_nombre text,
  responsable_email text,
  fecha_inicio_plan date,
  fecha_fin_plan date,
  fecha_inicio_real date,
  fecha_fin_real date,
  duracion_real_dias int,
  avance int DEFAULT 0 CHECK (avance BETWEEN 0 AND 100),
  estatus text NOT NULL DEFAULT 'pendiente' CHECK (estatus IN ('pendiente','en_proceso','finalizado','cancelado')),
  agregar_calendario boolean DEFAULT false,
  correo_invitado text,
  orden int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.actividades TO authenticated;
GRANT ALL ON public.actividades TO service_role;
ALTER TABLE public.actividades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "act_select" ON public.actividades FOR SELECT TO authenticated USING (true);
CREATE POLICY "act_insert" ON public.actividades FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "act_update" ON public.actividades FOR UPDATE TO authenticated USING (true);
CREATE POLICY "act_delete" ON public.actividades FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_actividades_updated BEFORE UPDATE ON public.actividades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.subtareas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actividad_id uuid NOT NULL REFERENCES public.actividades(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  completada boolean DEFAULT false,
  fecha_limite date,
  orden int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subtareas TO authenticated;
GRANT ALL ON public.subtareas TO service_role;
ALTER TABLE public.subtareas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sub_select" ON public.subtareas FOR SELECT TO authenticated USING (true);
CREATE POLICY "sub_insert" ON public.subtareas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "sub_update" ON public.subtareas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "sub_delete" ON public.subtareas FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.recalc_avance_proyecto()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE pid uuid; prom numeric;
BEGIN
  pid := COALESCE(NEW.proyecto_id, OLD.proyecto_id);
  SELECT COALESCE(AVG(avance),0) INTO prom FROM public.actividades
    WHERE proyecto_id = pid AND estatus <> 'cancelado';
  UPDATE public.proyectos SET avance_calculado = ROUND(prom,2) WHERE id = pid;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_recalc_avance
AFTER INSERT OR UPDATE OR DELETE ON public.actividades
FOR EACH ROW EXECUTE FUNCTION public.recalc_avance_proyecto();

-- ============ FASE 6: CALENDARIO (M2) ============
CREATE TABLE public.eventos_calendario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descripcion text,
  fecha_inicio timestamptz NOT NULL,
  fecha_fin timestamptz,
  tipo text NOT NULL CHECK (tipo IN ('proyecto','pnc','auditoria','manual')),
  referencia_id text,
  referencia_tabla text,
  color text,
  empresa_id uuid REFERENCES public.empresas(id),
  area_id uuid REFERENCES public.areas(id),
  creado_por uuid REFERENCES public.usuarios(id),
  google_calendar_event_id text,
  all_day boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eventos_calendario TO authenticated;
GRANT ALL ON public.eventos_calendario TO service_role;
ALTER TABLE public.eventos_calendario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ev_select" ON public.eventos_calendario FOR SELECT TO authenticated USING (true);
CREATE POLICY "ev_insert" ON public.eventos_calendario FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ev_update" ON public.eventos_calendario FOR UPDATE TO authenticated USING (true);
CREATE POLICY "ev_delete" ON public.eventos_calendario FOR DELETE TO authenticated USING (true);

-- ============ FASE 7: BÚSQUEDAS IA ============
CREATE TABLE public.busquedas_ia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  resultado_json jsonb,
  usuario_id uuid REFERENCES public.usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.busquedas_ia TO authenticated;
GRANT ALL ON public.busquedas_ia TO service_role;
ALTER TABLE public.busquedas_ia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bia_select" ON public.busquedas_ia FOR SELECT TO authenticated USING (true);
CREATE POLICY "bia_insert" ON public.busquedas_ia FOR INSERT TO authenticated WITH CHECK (true);

-- ============ FASE 8: CONFIG EMPRESA ============
CREATE TABLE public.org_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_completo text NOT NULL DEFAULT 'LIGS Group',
  logo_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.usuarios(id)
);
GRANT SELECT, INSERT, UPDATE ON public.org_config TO authenticated;
GRANT ALL ON public.org_config TO service_role;
ALTER TABLE public.org_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_select" ON public.org_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "org_insert" ON public.org_config FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "org_update" ON public.org_config FOR UPDATE TO authenticated USING (true);
INSERT INTO public.org_config (nombre_completo) VALUES ('LIGS Group — Logistics & Integrated Global Services');

-- ============ STORAGE OBJECT POLICIES ============
CREATE POLICY "storage_read_all" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('documentos','pnc-evidencias','auditorias','org-assets'));
CREATE POLICY "storage_insert_all" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('documentos','pnc-evidencias','auditorias','org-assets'));
CREATE POLICY "storage_update_all" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('documentos','pnc-evidencias','auditorias','org-assets'));
CREATE POLICY "storage_delete_all" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('documentos','pnc-evidencias','auditorias','org-assets'));

CREATE INDEX idx_pnc_estatus ON public.pnc(estatus);
CREATE INDEX idx_pnc_empresa ON public.pnc(empresa_id);
CREATE INDEX idx_documentos_estatus ON public.documentos(estatus);
CREATE INDEX idx_actividades_proyecto ON public.actividades(proyecto_id);
CREATE INDEX idx_hallazgos_auditoria ON public.auditoria_hallazgos(auditoria_id);
CREATE INDEX idx_eventos_fecha ON public.eventos_calendario(fecha_inicio);
