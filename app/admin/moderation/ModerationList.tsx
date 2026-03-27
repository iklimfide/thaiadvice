"use client";

import { slugSegmentForStorage } from "@/lib/data/storage-slug";
import {
  setSubmissionImageUrl,
  uploadSubmissionImage,
  type ModerationState,
} from "@/lib/actions/moderation";
import { useFormState } from "react-dom";

export type PendingSubmission = {
  id: string;
  created_at: string;
  title: string;
  category: string;
  content: string;
  image_url: string | null;
  author_alias: string;
  status: string;
};

const initial: ModerationState = { ok: true };

export function ModerationList({
  submissions,
}: {
  submissions: PendingSubmission[];
}) {
  if (submissions.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
        <p className="font-medium text-zinc-800">Bekleyen öneri yok</p>
        <p className="mt-2">
          Görsel alanları yalnızca ziyaretçi önerisi geldiğinde burada listelenen her
          satırın altında çıkar. İçeriğiniz doğrudan veritabanındaysa aşağıdaki{" "}
          <strong>yayında makaleler</strong> bölümünü kullanın.
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-8 space-y-10">
      {submissions.map((s) => (
        <li
          key={s.id}
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <SubmissionRow submission={s} />
        </li>
      ))}
    </ul>
  );
}

function SubmissionRow({ submission: s }: { submission: PendingSubmission }) {
  const [urlState, urlAction] = useFormState(setSubmissionImageUrl, initial);
  const [upState, upAction] = useFormState(uploadSubmissionImage, initial);
  const slugHint = slugSegmentForStorage(s.title);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">{s.title}</h2>
        <p className="mt-1 text-xs text-zinc-500">
          {s.category} · {s.author_alias} ·{" "}
          {new Date(s.created_at).toLocaleString("tr-TR")}
        </p>
        <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm text-zinc-700">
          {s.content}
        </p>
      </div>

      {s.image_url ? (
        <p className="text-sm">
          <span className="font-medium">Mevcut görsel:</span>{" "}
          <a
            href={s.image_url}
            target="_blank"
            rel="noreferrer"
            className="break-all text-emerald-700 underline"
          >
            {s.image_url}
          </a>
        </p>
      ) : (
        <p className="text-sm text-amber-800">Henüz görsel yok.</p>
      )}

      <form action={urlAction} className="space-y-2 border-t border-zinc-100 pt-4">
        <input type="hidden" name="id" value={s.id} />
        <input type="hidden" name="slug_hint" value={slugHint} />
        <label className="block text-sm font-medium">Görsel URL (isteğe bağlı)</label>
        <input
          name="image_url"
          type="url"
          placeholder="https://..."
          defaultValue={s.image_url ?? ""}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-white"
        >
          URL kaydet
        </button>
        {urlState.message ? (
          <p
            className={`text-sm ${urlState.ok ? "text-emerald-700" : "text-red-600"}`}
          >
            {urlState.message}
          </p>
        ) : null}
      </form>

      <form
        action={upAction}
        encType="multipart/form-data"
        className="space-y-2 border-t border-zinc-100 pt-4"
      >
        <input type="hidden" name="id" value={s.id} />
        <input type="hidden" name="slug_hint" value={slugHint} />
        <label className="block text-sm font-medium">Dosya yükle</label>
        <input
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="block w-full text-sm"
        />
        <button
          type="submit"
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm"
        >
          Storage’a yükle
        </button>
        {upState.message ? (
          <p
            className={`text-sm ${upState.ok ? "text-emerald-700" : "text-red-600"}`}
          >
            {upState.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
