-- Limpiar políticas existentes (duplicadas/permisivas) sobre storage.objects
DROP POLICY IF EXISTS "auth all auditorias" ON storage.objects;
DROP POLICY IF EXISTS "auth all pnc-evidencias" ON storage.objects;
DROP POLICY IF EXISTS "auth delete documentos" ON storage.objects;
DROP POLICY IF EXISTS "auth read documentos" ON storage.objects;
DROP POLICY IF EXISTS "auth update documentos" ON storage.objects;
DROP POLICY IF EXISTS "auth upload documentos" ON storage.objects;
DROP POLICY IF EXISTS "auth upload org-assets" ON storage.objects;
DROP POLICY IF EXISTS "public read org-assets" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_all" ON storage.objects;
DROP POLICY IF EXISTS "storage_insert_all" ON storage.objects;
DROP POLICY IF EXISTS "storage_read_all" ON storage.objects;
DROP POLICY IF EXISTS "storage_update_all" ON storage.objects;

-- ===== Buckets privados: documentos, pnc-evidencias, auditorias =====
-- Lectura compartida para el equipo (intencional en este sistema de calidad)
CREATE POLICY "private_read_authenticated" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id IN ('documentos','pnc-evidencias','auditorias'));

-- Subida para usuarios autenticados
CREATE POLICY "private_insert_authenticated" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('documentos','pnc-evidencias','auditorias'));

-- Solo el propietario o jefes/gerentes pueden actualizar
CREATE POLICY "private_update_owner_or_manager" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('documentos','pnc-evidencias','auditorias')
    AND (
      owner = auth.uid()
      OR public.has_role(auth.uid(), 'jefe_calidad')
      OR public.has_role(auth.uid(), 'gerente_calidad')
    )
  )
  WITH CHECK (
    bucket_id IN ('documentos','pnc-evidencias','auditorias')
    AND (
      owner = auth.uid()
      OR public.has_role(auth.uid(), 'jefe_calidad')
      OR public.has_role(auth.uid(), 'gerente_calidad')
    )
  );

-- Solo el propietario o jefes/gerentes pueden eliminar
CREATE POLICY "private_delete_owner_or_manager" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('documentos','pnc-evidencias','auditorias')
    AND (
      owner = auth.uid()
      OR public.has_role(auth.uid(), 'jefe_calidad')
      OR public.has_role(auth.uid(), 'gerente_calidad')
    )
  );

-- ===== Bucket público: org-assets (logos) =====
-- Sin política SELECT amplia: se evita listar archivos. Los logos siguen
-- siendo accesibles mediante su URL pública directa.
CREATE POLICY "orgassets_insert_authenticated" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'org-assets');

CREATE POLICY "orgassets_update_owner_or_manager" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'org-assets'
    AND (
      owner = auth.uid()
      OR public.has_role(auth.uid(), 'jefe_calidad')
      OR public.has_role(auth.uid(), 'gerente_calidad')
    )
  )
  WITH CHECK (
    bucket_id = 'org-assets'
    AND (
      owner = auth.uid()
      OR public.has_role(auth.uid(), 'jefe_calidad')
      OR public.has_role(auth.uid(), 'gerente_calidad')
    )
  );

CREATE POLICY "orgassets_delete_owner_or_manager" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'org-assets'
    AND (
      owner = auth.uid()
      OR public.has_role(auth.uid(), 'jefe_calidad')
      OR public.has_role(auth.uid(), 'gerente_calidad')
    )
  );