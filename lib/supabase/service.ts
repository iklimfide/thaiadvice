import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  ensureNodeFetchPrefersIpv4,
  normalizeSupabaseProjectUrl,
} from "@/lib/supabase/net";

let cached: SupabaseClient | null = null;

/** RLS bypass — yalnızca Server Actions / Route Handlers / Server Components. Asla istemciye import etmeyin. */
export function getSupabaseServiceRole(): SupabaseClient {
  if (cached) return cached;
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!rawUrl || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  ensureNodeFetchPrefersIpv4();
  const url = normalizeSupabaseProjectUrl(rawUrl);
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
