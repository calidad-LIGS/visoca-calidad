import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — VISOCA-Calidad" },
      { name: "description", content: "Acceso al sistema de gestión de calidad VISOCA de LIGS Group. Inicie sesión con sus credenciales autorizadas." },
      { property: "og:title", content: "Iniciar sesión — VISOCA-Calidad" },
      { property: "og:description", content: "Acceso al sistema de gestión de calidad VISOCA de LIGS Group." },
    ],
    links: [{ rel: "canonical", href: "/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { signIn, session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) {
      setError("Credenciales inválidas. Verifica tu correo y contraseña.");
    } else {
      navigate({ to: "/" });
    }
  };

  return (
    <div className="visoca-noise flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-bold text-primary">VISOCA</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Calidad · LIGS Group
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-border bg-card p-10"
        >
          <h2 className="mb-6 font-display text-lg font-semibold text-foreground">
            Iniciar sesión
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ligsgroup.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Iniciar sesión
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Acceso exclusivo para personal autorizado. Los usuarios son creados por
          el administrador del sistema.
        </p>
      </div>
    </div>
  );
}
