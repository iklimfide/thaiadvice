"use client";

import { slugSegmentForStorage } from "@/lib/data/storage-slug";
import {
  setQuestionImageUrl,
  uploadQuestionImage,
  type ModerationState,
} from "@/lib/actions/moderation";
import { useFormState } from "react-dom";

export type QuestionImageRow = {
  id: string;
  slug: string;
  title: string;
  image_url: string | null;
  lang: string;
};

const initial: ModerationState = { ok: true };

export function ModerationQuestionsList({
  questions,
}: {
  questions: QuestionImageRow[];
}) {
  if (questions.length === 0) {
    return (
      <p className="mt-4 text-sm text-zinc-600">
        Veritabanında bu dil için makale bulunamadı.
      </p>
    );
  }

  return (
    <ul className="mt-6 space-y-8">
      {questions.map((q) => (
        <li
          key={q.id}
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <QuestionRow question={q} />
        </li>
      ))}
    </ul>
  );
}

function QuestionRow({ question: q }: { question: QuestionImageRow }) {
  const [urlState, urlAction] = useFormState(setQuestionImageUrl, initial);
  const [upState, upAction] = useFormState(uploadQuestionImage, initial);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-zinc-900">{q.title}</h3>
        <p className="mt-1 font-mono text-xs text-zinc-500">
          /{q.lang}/…/{q.slug}
        </p>
      </div>

      {q.image_url ? (
        <p className="text-sm">
          <span className="font-medium">Görsel:</span>{" "}
          <a
            href={q.image_url}
            target="_blank"
            rel="noreferrer"
            className="break-all text-emerald-700 underline"
          >
            {q.image_url}
          </a>
        </p>
      ) : (
        <p className="text-sm text-amber-800">Görsel yok.</p>
      )}

      <form action={urlAction} className="space-y-2 border-t border-zinc-100 pt-4">
        <input type="hidden" name="id" value={q.id} />
        <input type="hidden" name="slug" value={slugSegmentForStorage(q.slug)} />
        <label className="block text-sm font-medium">Görsel URL</label>
        <input
          name="image_url"
          type="url"
          placeholder="https://..."
          defaultValue={q.image_url ?? ""}
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
        <input type="hidden" name="id" value={q.id} />
        <input type="hidden" name="slug" value={slugSegmentForStorage(q.slug)} />
        <label className="block text-sm font-medium">Dosyadan yükle (Storage)</label>
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
          Storage’a yükle ve makaleye bağla
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
