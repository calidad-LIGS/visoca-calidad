import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Empresa { id: string; nombre: string; clave: string; activo: boolean }
export interface Area { id: string; nombre: string; activo: boolean }
export interface Cargo { id: string; nombre: string; activo: boolean }
export interface UsuarioLite { id: string; nombre_completo: string; email: string; empresa_id: string | null }

export function useEmpresas() {
  return useQuery({
    queryKey: ["cat", "empresas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("id, nombre, clave, activo")
        .order("nombre");
      if (error) throw error;
      return data as Empresa[];
    },
    staleTime: 600_000,
  });
}

export function useAreas() {
  return useQuery({
    queryKey: ["cat", "areas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("areas")
        .select("id, nombre, activo")
        .order("nombre");
      if (error) throw error;
      return data as Area[];
    },
    staleTime: 600_000,
  });
}

export function useCargos() {
  return useQuery({
    queryKey: ["cat", "cargos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cargos")
        .select("id, nombre, activo")
        .order("nombre");
      if (error) throw error;
      return data as Cargo[];
    },
    staleTime: 600_000,
  });
}

export function useUsuarios() {
  return useQuery({
    queryKey: ["cat", "usuarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nombre_completo, email, empresa_id")
        .eq("activo", true)
        .order("nombre_completo");
      if (error) throw error;
      return data as UsuarioLite[];
    },
    staleTime: 600_000,
  });
}
