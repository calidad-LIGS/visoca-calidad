import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Provider helper para Lovable AI Gateway.
 * Solo se debe importar desde código de servidor (server functions).
 */
export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable-gateway",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
  });
}
