"use client";

import { createClient } from "@supabase/supabase-js";

// Browser client (anon key) — used only to upload audio straight to Storage,
// bypassing our API route so large mobile recordings don't hit body limits.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseClient = Boolean(url && anon);

export const supabaseBrowser = hasSupabaseClient
  ? createClient(url as string, anon as string)
  : null;
