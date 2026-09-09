"use client";

import { useState } from "react";

type Props = {
  type: string; // "ATELIER" | "BOUTIQUE" | "ENTREPRISE" | "INSTITUTION"
  modalText: string;
  modalLink?: string;
};

const poinconLabels: Record<string, string> = {
  ATELIER: "Atelier",
  BOUTIQUE: "Boutique",
  ENTREPRISE: "Entreprise",
  INSTITUTION: "Institution",
};

export function PoinconBadge({ type, modalText, modalLink }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-mag-red/30 bg-mag-cream/40 px-3 py-1.5 text-sm font-medium text-mag-red hover:bg-mag-red hover:text-white transition-colors"
        aria-label={`Poinçon ${poinconLabels[type] ?? type} — cliquer pour en savoir plus`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        Poinçon {poinconLabels[type] ?? type}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Poinçon ${poinconLabels[type] ?? type}`}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-mag-gray hover:text-mag-dark transition-colors"
              aria-label="Fermer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-mag-red text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </span>
              <h3 className="text-lg font-bold text-mag-dark font-serif">
                Poinçon {poinconLabels[type] ?? type}
              </h3>
            </div>

            <p className="text-sm text-mag-dark/70 leading-relaxed">{modalText}</p>

            {modalLink && (
              <a
                href={modalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-mag-red hover:underline"
              >
                En savoir plus
                <span aria-hidden>→</span>
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
