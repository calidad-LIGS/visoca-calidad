import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSignedUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

/** Resuelve una URL firmada temporal para un objeto almacenado en un bucket privado. */
export function useSignedUrl(
  bucket: string,
  path?: string | null,
  expiresIn = 3600,
) {
  return useQuery({
    queryKey: ["signed-url", bucket, path],
    queryFn: () => getSignedUrl(bucket, path ?? null, expiresIn),
    enabled: !!path,
    // Refrescamos antes de que expire la firma (45 min < 60 min).
    staleTime: 1000 * 60 * 45,
  });
}

interface SignedFileLinkProps {
  bucket: string;
  path?: string | null;
  children: ReactNode;
  className?: string;
  download?: boolean;
}

/**
 * Enlace de descarga que genera una URL firmada bajo demanda.
 * Mientras se resuelve la firma muestra el contenido deshabilitado.
 */
export function SignedFileLink({
  bucket,
  path,
  children,
  className,
  download = false,
}: SignedFileLinkProps) {
  const { data: url, isLoading } = useSignedUrl(bucket, path);

  if (!path) return null;

  if (isLoading || !url) {
    return (
      <span
        className={cn("pointer-events-none opacity-60", className)}
        aria-busy={isLoading}
      >
        {children}
      </span>
    );
  }

  return (
    <a
      href={url}
      className={className}
      {...(download
        ? { download: true }
        : { target: "_blank", rel: "noreferrer" })}
    >
      {children}
    </a>
  );
}
