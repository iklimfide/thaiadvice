"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginError = searchParams?.get("error") ?? "";
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setPending(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.push("/tr");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      {loginError === "config" ? (
        <p className="text-sm text-red-600">
          Sunucuda Supabase ortam değişkenleri eksik (
          <code className="rounded bg-zinc-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> ve
          anon anahtar). Vercel proje ayarlarından ekleyin.
        </p>
      ) : null}
      {loginError === "forbidden" ? (
        <p className="text-sm text-red-600">
          Bu hesap moderasyon yetkisine sahip değil (MASTER_EMAILS).
        </p>
      ) : null}
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          E-posta
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Şifre
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Giriş…" : "Giriş"}
      </button>
    </form>
  );
}
