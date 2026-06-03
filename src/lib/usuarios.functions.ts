import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const roleEnum = z.enum([
  "gerente_calidad",
  "jefe_calidad",
  "analista",
  "auditor_interno",
]);

const createSchema = z.object({
  nombre_completo: z.string().min(2).max(160),
  email: z.string().email().max(200),
  password: z.string().min(6).max(72),
  rol: roleEnum,
  empresa_id: z.string().uuid().nullable().optional(),
});

const updateRoleSchema = z.object({
  user_id: z.string().uuid(),
  rol: roleEnum,
});

async function assertGerente(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "gerente_calidad",
  });
  if (error || !data) {
    throw new Error("No autorizado: se requiere rol Gerente de Calidad");
  }
}

export const createUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertGerente(context.supabase, context.userId);

    const { data: created, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { nombre_completo: data.nombre_completo },
      });

    if (createError || !created.user) {
      throw new Error(createError?.message ?? "No se pudo crear la cuenta");
    }

    const uid = created.user.id;

    const { error: perfilError } = await supabaseAdmin.from("usuarios").insert({
      id: uid,
      nombre_completo: data.nombre_completo,
      email: data.email,
      empresa_id: data.empresa_id ?? null,
      activo: true,
    });
    if (perfilError) {
      await supabaseAdmin.auth.admin.deleteUser(uid);
      throw new Error(perfilError.message);
    }

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: uid, role: data.rol });
    if (roleError) throw new Error(roleError.message);

    return { id: uid };
  });

export const updateUsuarioRol = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateRoleSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertGerente(context.supabase, context.userId);
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.user_id, role: data.rol });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
