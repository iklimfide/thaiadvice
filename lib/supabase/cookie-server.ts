import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getUrlAndKey(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ve anon/publishable anahtar gerekli (oturum)."
    );
  }
  return { url, key };
}

/** Cookie tabanlı oturum — Server Components, Server Actions, Route Handlers. */
export async function createServerSupabaseForAuth() {
  const { url, key } = getUrlAndKey();
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
