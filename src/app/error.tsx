"use client";

import Link from "next/link";
import { useEffect } from "react";

// Erreur de rendu (ex. base injoignable sur une page rendue à la demande) :
// page aux couleurs du site au lieu de la page d'erreur brute de Next.
export default function ErrorPage({
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
    <div className="min-h-[70vh] flex items-center justify-center px-4 bg-mag-sand grain-overlay">
      <div className="text-center max-w-lg py-20">
        <h1 className="text-4xl font-black text-mag-dark mb-4 font-serif">
          Une erreur est survenue
        </h1>
        <p className="text-mag-dark/70 mb-8 leading-relaxed">
          Cette page n&apos;a pas pu être affichée. Réessayez dans quelques instants.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-mag-red px-6 py-3 text-sm font-semibold text-white hover:bg-mag-red-dark transition-colors"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-mag-red px-6 py-3 text-sm font-semibold text-mag-red hover:bg-mag-red hover:text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Retour à l&apos;accueil
          </Link>
        </div>
        {error.digest && (
          <p className="mt-8 text-xs text-mag-gray">Référence : {error.digest}</p>
        )}
      </div>
    </div>
  );
}
