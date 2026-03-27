import { assertMasterOrRedirect } from "@/lib/admin/auth-server";
import { getSupabaseServiceRole } from "@/lib/supabase/service";
import { AdminLogout } from "./AdminLogout";
import { ModerationList, type PendingSubmission } from "./ModerationList";
import {
  ModerationQuestionsList,
  type QuestionImageRow,
} from "./ModerationQuestionsList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Moderasyon",
};

export default async function AdminModerationPage() {
  await assertMasterOrRedirect();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="text-xl font-semibold">Moderasyon</h1>
        <p className="mt-4 text-sm text-red-700">
          Bu sayfa listeleme ve güncelleme için{" "}
          <code className="rounded bg-zinc-200 px-1">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
          gerektirir (.env.local).
        </p>
        <div className="mt-6">
          <AdminLogout />
        </div>
      </div>
    );
  }

  const db = getSupabaseServiceRole();
  const { data, error } = await db
    .from("article_submissions")
    .select(
      "id, created_at, title, category, content, image_url, author_alias, status"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const { data: questions, error: questionsError } = await db
    .from("questions")
    .select("id, slug, title, image_url, lang")
    .eq("lang", "tr")
    .order("created_at", { ascending: false })
    .limit(60);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Moderasyon</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Görseller: URL veya Supabase Storage (
            <code className="rounded bg-zinc-200 px-1">blog-images</code>).
          </p>
        </div>
        <AdminLogout />
      </div>

      <section className="mt-10 border-t border-zinc-200 pt-10">
        <h2 className="text-lg font-semibold">Bekleyen ziyaretçi önerileri</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Ana sayfadaki öneri formundan gelen, henüz onaylanmamış kayıtlar.
        </p>
        {error ? (
          <p className="mt-6 text-sm text-red-600">
            Liste alınamadı: {error.message}
          </p>
        ) : (
          <ModerationList submissions={(data ?? []) as PendingSubmission[]} />
        )}
      </section>

      <section className="mt-12 border-t border-zinc-200 pt-10">
        <h2 className="text-lg font-semibold">Yayında makaleler (TR)</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Import veya editörle eklenen <code className="rounded bg-zinc-200 px-1">questions</code>{" "}
          satırları — son 60 makale. Görseli URL ile veya dosya yükleyerek güncelleyin.
        </p>
        {questionsError ? (
          <p className="mt-4 text-sm text-red-600">
            Makale listesi alınamadı: {questionsError.message}
          </p>
        ) : (
          <ModerationQuestionsList
            questions={(questions ?? []) as QuestionImageRow[]}
          />
        )}
      </section>
    </div>
  );
}
