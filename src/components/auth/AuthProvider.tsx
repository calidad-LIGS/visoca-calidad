import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/roles";

interface Perfil {
  id: string;
  nombre_completo: string;
  email: string;
  empresa_id: string | null;
  activo: boolean;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  perfil: Perfil | null;
  roles: AppRole[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  isGerente: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string) => {
    const [{ data: perfilData, error: perfilErr }, { data: rolesData, error: rolesErr }] =
      await Promise.all([
        supabase
          .from("usuarios")
          .select("id, nombre_completo, email, empresa_id, activo")
          .eq("id", uid)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
      ]);

    if (perfilErr) console.error("[Auth] Error cargando perfil:", perfilErr);
    if (rolesErr) console.error("[Auth] Error cargando roles:", rolesErr);

    // Los roles viven exclusivamente en la tabla user_roles (regla de seguridad).
    // Si la query falla o no devuelve roles, el array queda vacío y el fallback
    // de permisos (sinRoles en permisos.ts) mantiene la UI utilizable.
    const finalRoles = (rolesData ?? []).map((r) => r.role as AppRole);

    setPerfil(perfilData ?? null);
    setRoles(finalRoles);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        // Defer Supabase calls to avoid deadlocks inside the callback
        setTimeout(() => loadProfile(newSession.user.id), 0);
      } else {
        setPerfil(null);
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setPerfil(null);
    setRoles([]);
  }, []);

  const refresh = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles]);

  const value: AuthContextValue = {
    session,
    user,
    perfil,
    roles,
    loading,
    signIn,
    signOut,
    hasRole,
    isGerente: roles.includes("gerente_calidad"),
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
