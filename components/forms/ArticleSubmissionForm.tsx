"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  submitArticleSuggestion,
  type FormState,
} from "@/lib/actions/article-submission";
import { QUESTION_CATEGORY_DEFS } from "@/lib/data/question-categories";

const initial: FormState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
    >
      {pending ? "Gönderiliyor…" : "Gönder"}
    </button>
  );
}

type FormProps = { lang?: string };

export function ArticleSubmissionForm({ lang = "tr" }: FormProps) {
  const [state, formAction] = useFormState(submitArticleSuggestion, initial);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-zinc-900">İçerik önerisi</h2>
      <p className="text-sm text-zinc-600">
        Gönderiler <code className="rounded bg-zinc-100 px-1">article_submissions</code>{" "}
        tablosuna kaydedilir (moderasyon sonrası yayın).
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700">
            Takma ad (author_alias)
          </span>
          <input
            name="author_alias"
            required
            maxLength={120}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700">
            {lang === "tr" ? "Kategori" : "Category"}
          </span>
          <select
            name="category"
            required
            defaultValue=""
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
          >
            <option value="" disabled>
              {lang === "tr" ? "Kategori seçin" : "Choose category"}
            </option>
            {QUESTION_CATEGORY_DEFS.map((d) => (
              <option key={d.slug} value={d.slug}>
                {lang === "tr" ? d.labelTr : d.labelEn}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-zinc-700">Başlık</span>
        <input
          name="title"
          required
          maxLength={200}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-zinc-700">İçerik</span>
        <textarea
          name="content"
          required
          rows={6}
          maxLength={20000}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-zinc-700">
          Görsel URL (isteğe bağlı, image_url)
        </span>
        <input
          name="image_url"
          type="url"
          maxLength={2000}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
        />
      </label>
      {state.message ? (
        <p
          className={
            state.ok ? "text-sm text-green-700" : "text-sm text-red-700"
          }
          role="status"
        >
          {state.message}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
