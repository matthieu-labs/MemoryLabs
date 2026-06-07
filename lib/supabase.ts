import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export { RECORDINGS_BUCKET } from "./constants";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const hasSupabase = Boolean(
  SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Server-side client (service role) — full access, used in API routes only.
export function supabaseAdmin(): SupabaseClient {
  return createClient(
    SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );
}
