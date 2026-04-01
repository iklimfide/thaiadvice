/**
 * `server-only` yok: `scripts/translate-all-tr-to-en.ts` (tsx) doğrudan import eder.
 * İstemci bundle’ına eklemeyin.
 */
import OpenAI from "openai";

export type QuestionFieldsForTranslate = {
  title: string;
  excerpt: string | null;
  content: string;
  media_seo_text: string | null;
};

export type TranslatedQuestionFields = {
  title: string;
  excerpt: string | null;
  content: string;
  media_seo_text: string | null;
};

function stripJsonFence(raw: string): string {
  let t = raw.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (m) return m[1].trim();
  return t;
}

export async function translateQuestionFieldsTrToEn(
  input: QuestionFieldsForTranslate
): Promise<TranslatedQuestionFields> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENAI_API_KEY tanımlı değil.");
  }
  const model =
    process.env.OPENAI_TRANSLATE_MODEL?.trim() || "gpt-4o-mini";

  const client = new OpenAI({ apiKey: key });

  const userPayload = {
    title: input.title,
    excerpt: input.excerpt ?? "",
    content: input.content,
    media_seo_text: input.media_seo_text ?? "",
  };

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.25,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You translate Thai travel/guide articles from Turkish to natural English. " +
          "Respond with ONE JSON object only, keys: title (string), excerpt (string, use empty string if none), " +
          "content (string, GitHub-flavored Markdown), media_seo_text (string, empty if none). " +
          "Preserve Markdown structure (headings, lists, bold, links). " +
          "Do not translate URL paths or slugs inside links; keep internal paths exactly as in the source (e.g. /tr/region/...). " +
          "The server rewrites /tr/ to /en/ for this site after translation.",
      },
      {
        role: "user",
        content: JSON.stringify(userPayload),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error("OpenAI yanıtı boş.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFence(raw));
  } catch {
    throw new Error("OpenAI JSON çözülemedi.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("OpenAI yanıtı geçersiz.");
  }

  const o = parsed as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title.trim() : "";
  const content = typeof o.content === "string" ? o.content.trim() : "";
  if (!title || !content) {
    throw new Error("Çeviride başlık veya içerik eksik.");
  }

  const excerptRaw = o.excerpt;
  const excerpt =
    typeof excerptRaw === "string" && excerptRaw.trim()
      ? excerptRaw.trim()
      : null;

  const mediaRaw = o.media_seo_text;
  const media_seo_text =
    typeof mediaRaw === "string" && mediaRaw.trim()
      ? mediaRaw.trim()
      : null;

  return { title, excerpt, content, media_seo_text };
}
