import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabasePublicConfigured } from "@/lib/supabase/env";
import {
  ensureNodeFetchPrefersIpv4,
  normalizeSupabaseProjectUrl,
} from "@/lib/supabase/net";

let cached: SupabaseClient | null = null;

/**
 * Ortam veya URL geçersizse null — sayfa 500 vermez (boş liste / null).
 * Server Actions zorunlu DB için `getSupabase()` kullanır.
 */
export function getSupabaseOrNull(): SupabaseClient | null {
  if (!isSupabasePublicConfigured()) return null;
  if (cached) return cached;
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim();
  if (!rawUrl || !key) return null;
  try {
    ensureNodeFetchPrefersIpv4();
    const url = normalizeSupabaseProjectUrl(rawUrl);
    cached = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            cache: "no-store",
          }),
      },
    });
    return cached;
  } catch {
    return null;
  }
}

/** Okuma sorgularında kullanmayın; `getSupabaseOrNull` tercih edin. */
export function getSupabase(): SupabaseClient {
  const c = getSupabaseOrNull();
  if (!c) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and a public key (NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)"
    );
  }
  return c;
}
