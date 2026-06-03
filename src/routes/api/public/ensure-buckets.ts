import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Idempotently creates the storage buckets used across the app.
const BUCKETS = ["documentos", "pnc-evidencias", "auditorias", "org-assets"];

export const Route = createFileRoute("/api/public/ensure-buckets")({
  server: {
    handlers: {
      POST: async () => {
        const results: Record<string, string> = {};
        for (const id of BUCKETS) {
          const { error } = await supabaseAdmin.storage.createBucket(id, {
            public: true,
            fileSizeLimit: 10485760,
          });
          results[id] = error
            ? error.message.includes("already exists")
              ? "exists"
              : error.message
            : "created";
        }
        return Response.json({ ok: true, results });
      },
    },
  },
});
