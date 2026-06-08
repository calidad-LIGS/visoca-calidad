// Server-side Supabase client with service role key - bypasses RLS.
// Use this for admin operations in server functions and server routes only.
// For user-authenticated queries (with RLS), use the auth middleware instead.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function createSupabaseAdminClient() {
  const SUPABASE_URL =
    process.env.SUPABASE_URL ||
    "https://dxybknubfwqwqrlknncm.supabase.co";

  // Lovable reserves the SUPABASE_ prefix for its own managed secrets.
  // We store the service role key as ADMIN_SERVICE_KEY instead.
  // For local development you can still use SUPABASE_SERVICE_ROLE_KEY in .env.
  const serviceRoleKey =
    process.env.ADMIN_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    const message =
      "Missing secret ADMIN_SERVICE_KEY. " +
      "Go to Lovable Cloud → Secrets and add ADMIN_SERVICE_KEY with your Supabase service_role key.";
    console.error(`[Supabase Admin] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(SUPABASE_URL, serviceRoleKey, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | undefined;

// Server-side Supabase client with service role - bypasses RLS
// SECURITY: Only use this for trusted server-side operations, never expose to client code
// Import like: import { supabaseAdmin } from "@/integrations/supabase/client.server";
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});
