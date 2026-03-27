"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <h2 className="text-xl font-semibold text-zinc-900">
        Bir şeyler ters gitti
      </h2>
      <p className="mt-2 text-sm text-zinc-600">
        {error.message || "Beklenmeyen bir hata oluştu."}
      </p>
      {error.digest ? (
        <p className="mt-1 font-mono text-xs text-zinc-400">{error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="mt-8 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
      >
        Tekrar dene
      </button>
    </div>
  );
}
