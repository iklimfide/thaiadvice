"use client";

/**
 * Kök layout’ın dışında patlayan hatalar için zorunlu minimal kabuk.
 * Kendi <html> ve <body> etiketlerini içermeli (Next.js dokümantasyonu).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body className="font-sans antialiased">
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
          <h2 className="text-xl font-semibold text-zinc-900">
            Kritik hata
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            {error.message || "Sayfa yüklenemedi."}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-8 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Tekrar dene
          </button>
        </div>
      </body>
    </html>
  );
}
