import { supabase } from "@/integrations/supabase/client";

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

export interface UploadResult {
  /** Storage object path (NOT a URL). Persist this in the database. */
  path: string;
  name: string;
}

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

/**
 * Dominios externos permitidos para enlaces de documentos (p. ej. Google Drive)
 * y el almacenamiento de Supabase. Cualquier otra URL absoluta se considera
 * insegura para evitar redirecciones abiertas (open redirect) almacenadas.
 */
function isAllowedExternalUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  return (
    host === "drive.google.com" ||
    host === "docs.google.com" ||
    host === "sheets.google.com" ||
    host === "storage.googleapis.com" ||
    host.endsWith(".supabase.co")
  );
}

/**
 * Devuelve la URL externa solo si pertenece a un dominio de confianza.
 * Útil para renderizar enlaces controlados por el usuario (drive_url) de forma segura.
 */
export function safeExternalUrl(value?: string | null): string | null {
  if (!value) return null;
  return isAllowedExternalUrl(value) ? value : null;
}

/** Sube un archivo a un bucket privado y devuelve la ruta del objeto. */
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
  return { path, name: file.name };
}

/**
 * Genera una URL firmada temporal para descargar un objeto de un bucket privado.
 * Si `path` ya es una URL absoluta (enlaces externos o datos heredados) se devuelve tal cual.
 */
export async function getSignedUrl(
  bucket: string,
  path?: string | null,
  expiresIn = 3600,
): Promise<string | null> {
  if (!path) return null;
  if (isAbsoluteUrl(path)) return path;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error) return null;
  return data.signedUrl;
}

/** URL pública para buckets públicos (p. ej. logos de la organización). */
export function getPublicUrl(bucket: string, path: string): string {
  if (isAbsoluteUrl(path)) return path;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export function sanitizeSegment(s: string) {
  return s.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
}
