import { RegionCard } from "@/components/cards/RegionCard";
import { isSupabasePublicConfigured } from "@/lib/supabase/env";
import type { RegionRow } from "@/lib/types/database";

type Props = {
  lang: string;
  regions: RegionRow[];
  loadError: string | null;
};

export function RegionsListing({ lang, regions, loadError }: Props) {
  if (!isSupabasePublicConfigured()) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900">
        <p className="font-medium">Supabase ortam değişkenleri eksik</p>
        <p className="mt-1 text-red-800/90">
          <code className="rounded bg-red-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
          ve{" "}
          <code className="rounded bg-red-100 px-1">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>{" "}
          veya{" "}
          <code className="rounded bg-red-100 px-1">
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
          </code>{" "}
          değerlerini <code className="rounded bg-red-100 px-1">.env.local</code>{" "}
          dosyasına ekleyin.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
        <p className="font-medium">Supabase’den bölgeler alınamadı</p>
        <p className="mt-1 text-amber-900/90">{loadError}</p>
        <p className="mt-2 text-xs text-amber-800/80">
          Tablo adı <code className="rounded bg-amber-100 px-1">regions</code>,
          RLS okuma izni ve API anahtarını kontrol edin.
          {loadError.toLowerCase().includes("fetch failed") ? (
            <>
              {" "}
              <strong>fetch failed</strong> genelde ağ veya DNS kaynaklıdır
              (VPN, güvenlik duvarı, IPv6); projede IPv4 önceliği açıldı —
              sunucuyu yeniden başlatın. Hâlâ olursa tarayıcıdan Supabase
              paneline erişebildiğinizi doğrulayın.
            </>
          ) : null}
        </p>
      </div>
    );
  }

  if (regions.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-violet-50/50 px-4 py-8 text-center text-sm text-zinc-600">
        <p className="font-medium text-zinc-800">Henüz bölge kaydı yok</p>
        <p className="mt-2">
          Supabase’de{" "}
          <code className="rounded bg-violet-100 px-1.5 py-0.5 text-brand-dark">
            regions
          </code>{" "}
          tablosuna satır ekleyin; bağlantı kuruldu ve sorgu başarılı.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {regions.map((r) => (
        <RegionCard key={r.id} lang={lang} region={r} />
      ))}
    </div>
  );
}
