import { createBrowserClient } from "@supabase/ssr";

function getUrlAndKey(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ve anon/publishable anahtar gerekli (tarayıcı)."
    );
  }
  return { url, key };
}

export function createBrowserSupabaseClient() {
  const { url, key } = getUrlAndKey();
  return createBrowserClient(url, key);
}
