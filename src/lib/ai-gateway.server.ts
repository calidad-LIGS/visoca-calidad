// ai-gateway.server.ts
// Wrapper para Anthropic API — solo usar en server functions
//
// Requiere la variable de entorno ANTHROPIC_API_KEY.
// En Lovable Cloud → Settings → Environment Variables agregar:
//   ANTHROPIC_API_KEY = [la key real de Anthropic]
import Anthropic from "@anthropic-ai/sdk";

export function createAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no configurada en variables de entorno");
  return new Anthropic({ apiKey });
}
