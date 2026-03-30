import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getUrlAndKey(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim();
  if (!url || !key) return null;
  return { url, key };
}

/**
 * Cookie tabanlı oturum — Server Components, Server Actions, Route Handlers.
 * Ortam değişkenleri yoksa null (layout çökmez; master denetimi devre dışı kalır).
 */
export async function createServerSupabaseForAuth(): Promise<SupabaseClient | null> {
  const pair = getUrlAndKey();
  if (!pair) return null;
  const { url, key } = pair;
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          /* Server Component içinde set edilemeyebilir */
        }
      },
    },
  });
}
