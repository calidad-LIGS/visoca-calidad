import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({ query: z.string().min(2).max(500) });

export interface BusquedaResultadoItem {
  id: string;
  codigo: string;
  nombre: string;
  motivo: string;
  relevancia: number;
}
export interface BusquedaResultado {
  resumen: string;
  documentos: BusquedaResultadoItem[];
}

export const buscarDocumentosIA = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }): Promise<BusquedaResultado> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Falta LOVABLE_API_KEY");

    const { supabase } = context;
    const { data: docs, error } = await supabase
      .from("documentos")
      .select("id, codigo, nombre, tipo, comentarios")
      .eq("estatus", "vigente")
      .limit(400);
    if (error) throw new Error(error.message);

    const catalogo = (docs ?? []).map((d) =>
      `${d.id} | ${d.codigo} | ${d.nombre} | ${d.tipo}${d.comentarios ? ` | ${d.comentarios}` : ""}`,
    ).join("\n");

    if (!catalogo) {
      return { resumen: "No hay documentos vigentes en el sistema.", documentos: [] };
    }

    const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
    const { generateText, Output } = await import("ai");
    const gateway = createLovableAiGatewayProvider(apiKey);

    const schema = z.object({
      resumen: z.string(),
      documentos: z.array(z.object({
        id: z.string(),
        codigo: z.string(),
        nombre: z.string(),
        motivo: z.string(),
        relevancia: z.number().min(0).max(100),
      })),
    });

    const { experimental_output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      experimental_output: Output.object({ schema }),
      system:
        "Eres un asistente del sistema de gestión de calidad de LIGS Group. " +
        "Recibes un catálogo de documentos vigentes (id | código | nombre | tipo | comentarios) y una consulta en lenguaje natural. " +
        "Devuelve únicamente los documentos relevantes (máximo 8), ordenados por relevancia descendente, usando los id y código exactos del catálogo. " +
        "El campo 'motivo' explica en una frase por qué es relevante. Escribe en español. Si nada es relevante, devuelve un arreglo vacío.",
      prompt: `Catálogo de documentos:\n${catalogo}\n\nConsulta del usuario: "${data.query}"`,
    });

    const out = experimental_output as z.infer<typeof schema>;
    // Asegurar que solo se devuelvan ids existentes
    const validIds = new Set((docs ?? []).map((d) => d.id));
    out.documentos = out.documentos.filter((d) => validIds.has(d.id)).slice(0, 8);

    // Guardar historial (no bloqueante)
    await supabase.from("busquedas_ia").insert({
      query: data.query,
      resultado_json: JSON.parse(JSON.stringify(out)),
      usuario_id: context.userId,
    });

    return out;
  });
