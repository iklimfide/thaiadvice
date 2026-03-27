import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  ensureNodeFetchPrefersIpv4,
  normalizeSupabaseProjectUrl,
} from "@/lib/supabase/net";

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (cached) return cached;
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim();
  if (!rawUrl || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and a public key (NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)"
    );
  }
  ensureNodeFetchPrefersIpv4();
  const url = normalizeSupabaseProjectUrl(rawUrl);
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      /** Next.js fetch varsayılanı veriyi önbelleğe alabilir; boş liste “takılı” kalır. */
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: "no-store",
        }),
    },
  });
  return cached;
}
