import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

interface CrearColaboradorInput {
  nombre_completo: string;
  empresa_id: string | null;
  cargo_id: string | null;
  usuario: string;
}

export const crearColaborador = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as CrearColaboradorInput)
  .handler(async ({ data }) => {
    const email = `${data.usuario}@colaborador.visoca.internal`;
    const password = crypto.randomUUID();

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) throw new Error(authError.message);
    const userId = authData.user.id;

    // 2. Insertar perfil en tabla colaboradores
    const { error: colError } = await supabaseAdmin
      .from("colaboradores")
      .insert({
        id: userId,
        nombre_completo: data.nombre_completo,
        empresa_id: data.empresa_id,
        cargo_id: data.cargo_id,
        usuario: data.usuario,
        activo: true,
      });

    if (colError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(colError.message);
    }

    // 3. Asignar rol colaborador
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "colaborador" });

    if (roleError) {
      console.warn("[crearColaborador] Error asignando rol:", roleError.message);
    }

    // 4. Auto-vincular documentos por cargo
    if (data.cargo_id) {
      const { data: docsCargo } = await supabaseAdmin
        .from("documentos_cargos")
        .select("documento_id")
        .eq("cargo_id", data.cargo_id);

      if (docsCargo && docsCargo.length > 0) {
        await supabaseAdmin.from("colaborador_documentos").insert(
          docsCargo.map((d) => ({
            colaborador_id: userId,
            documento_id: d.documento_id,
            visible: true,
          }))
        );
      }
    }

    return { ok: true, usuario: data.usuario };
  });
