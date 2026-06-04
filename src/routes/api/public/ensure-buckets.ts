import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Idempotently creates the storage buckets used across the app.
// Sensitive business documents are kept PRIVATE and served via signed URLs.
// Only the organization assets bucket (logos) is public for inline display.
//
// SECURITY: This is a privileged, one-time infrastructure task that uses the
// service-role admin client. It is protected by a deploy-time secret. Set the
// BOOTSTRAP_SECRET environment variable and pass it as the `x-bootstrap-secret`
// header to invoke. If the secret is not configured, the endpoint is disabled.
const BUCKETS: { id: string; public: boolean }[] = [
  { id: "documentos", public: false },
  { id: "pnc-evidencias", public: false },
  { id: "auditorias", public: false },
  { id: "org-assets", public: true },
];

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export const Route = createFileRoute("/api/public/ensure-buckets")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.BOOTSTRAP_SECRET;
        if (!expected) {
          return Response.json(
            { error: "Endpoint disabled: BOOTSTRAP_SECRET not configured." },
            { status: 403 },
          );
        }
        const provided = request.headers.get("x-bootstrap-secret") ?? "";
        if (!timingSafeEqual(provided, expected)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const results: Record<string, string> = {};
        for (const b of BUCKETS) {
          const { error } = await supabaseAdmin.storage.createBucket(b.id, {
            public: b.public,
            fileSizeLimit: 10485760,
          });
          if (error) {
            results[b.id] = error.message.includes("already exists")
              ? "exists"
              : error.message;
            // Ensure existing buckets match the desired visibility.
            if (results[b.id] === "exists") {
              await supabaseAdmin.storage.updateBucket(b.id, {
                public: b.public,
                fileSizeLimit: 10485760,
              });
            }
          } else {
            results[b.id] = "created";
          }
        }
        return Response.json({ ok: true, results });
      },
    },
  },
});
