import { supabase } from "@/integrations/supabase/client";

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

export interface UploadResult {
  url: string;
  path: string;
  name: string;
}

/** Sube un archivo a un bucket público y devuelve la URL pública. */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
): Promise<UploadResult> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("El archivo supera el tamaño máximo de 10MB.");
  }
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, path, name: file.name };
}

export function sanitizeSegment(s: string) {
  return s.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
}
