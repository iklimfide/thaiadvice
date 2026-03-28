import { parseMasterEmails } from "@/lib/admin/master";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Moderasyon girişi",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  const masters = parseMasterEmails();
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-semibold">Moderasyon girişi</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Sadece <code className="rounded bg-zinc-200 px-1">MASTER_EMAILS</code>{" "}
        listesindeki Supabase kullanıcıları erişebilir.
      </p>
      {masters.length === 0 ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Sunucuda <code className="rounded bg-amber-100 px-1">MASTER_EMAILS</code>{" "}
          tanımlı değil; giriş yapsanız bile moderasyon reddedilir.
        </p>
      ) : null}
      <Suspense fallback={<p className="mt-6 text-sm text-zinc-500">Yükleniyor…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
