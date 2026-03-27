"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLogout() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setPending(false);
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void logout()}
      className="text-sm text-zinc-600 underline underline-offset-2 disabled:opacity-50"
    >
      {pending ? "Çıkış…" : "Çıkış"}
    </button>
  );
}
