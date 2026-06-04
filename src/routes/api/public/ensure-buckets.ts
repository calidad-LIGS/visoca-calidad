import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Idempotently creates the storage buckets used across the app.
// Sensitive business documents are kept PRIVATE and served via signed URLs.
// Only the organization assets bucket (logos) is public for inline display.
const BUCKETS: { id: string; public: boolean }[] = [
  { id: "documentos", public: false },
  { id: "pnc-evidencias", public: false },
  { id: "auditorias", public: false },
  { id: "org-assets", public: true },
];

export const Route = createFileRoute("/api/public/ensure-buckets")({
  server: {
    handlers: {
      POST: async () => {
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
