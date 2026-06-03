import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// One-time bootstrap of the first Gerente de Calidad account.
// Self-disables once any usuario exists.
const DEFAULT_EMAIL = "admin@visoca.com";
const DEFAULT_PASSWORD = "Visoca2026!";

export const Route = createFileRoute("/api/public/bootstrap")({
  server: {
    handlers: {
      POST: async () => {
        const { count, error: countError } = await supabaseAdmin
          .from("usuarios")
          .select("id", { count: "exact", head: true });

        if (countError) {
          return Response.json({ error: countError.message }, { status: 500 });
        }
        if ((count ?? 0) > 0) {
          return Response.json(
            { error: "Ya existen usuarios. Bootstrap deshabilitado." },
            { status: 403 },
          );
        }

        const { data: created, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email: DEFAULT_EMAIL,
            password: DEFAULT_PASSWORD,
            email_confirm: true,
            user_metadata: { nombre_completo: "Administrador VISOCA" },
          });
        if (createError || !created.user) {
          return Response.json(
            { error: createError?.message ?? "No se pudo crear la cuenta" },
            { status: 500 },
          );
        }

        const uid = created.user.id;
        await supabaseAdmin.from("usuarios").insert({
          id: uid,
          nombre_completo: "Administrador VISOCA",
          email: DEFAULT_EMAIL,
          activo: true,
        });
        await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: uid, role: "gerente_calidad" });

        return Response.json({
          ok: true,
          email: DEFAULT_EMAIL,
          password: DEFAULT_PASSWORD,
        });
      },
    },
  },
});
