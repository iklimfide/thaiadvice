"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMaster } from "./MasterContext";

export function MasterSiteBar() {
  const { isMaster } = useMaster();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (!isMaster) return null;

  async function logout() {
    setPending(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setPending(false);
    router.push("/tr");
    router.refresh();
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-amber-200/80 bg-amber-50/95 px-4 py-2 text-sm shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-sm"
      role="navigation"
      aria-label="Yönetici çubuğu"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-amber-950">Yönetici oturumu</span>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/moderation"
            className="text-amber-900 underline underline-offset-2 hover:text-amber-700"
          >
            Kuyruk / liste
          </Link>
          <button
            type="button"
            disabled={pending}
            onClick={() => void logout()}
            className="rounded-md bg-amber-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
          >
            {pending ? "Çıkış…" : "Çıkış"}
          </button>
        </div>
      </div>
    </div>
  );
}
