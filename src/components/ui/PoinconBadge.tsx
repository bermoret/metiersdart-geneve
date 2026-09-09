"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  type: string; // "ATELIER" | "BOUTIQUE" | "ENTREPRISE" | "INSTITUTION"
  modalText: string;
  modalLink?: string;
  variant?: "badge" | "image";
};

const poinconLabels: Record<string, string> = {
  ATELIER: "Atelier",
  BOUTIQUE: "Boutique",
  ENTREPRISE: "Entreprise",
  INSTITUTION: "Institution",
};

const poinconImages: Record<string, string> = {
  ATELIER: "https://metiersdart-geneve.ch/images/2025/05/21/atelier.png",
  BOUTIQUE: "https://metiersdart-geneve.ch/images/2025/05/21/boutique.png",
  ENTREPRISE: "https://metiersdart-geneve.ch/images/2025/05/21/entreprise.png",
  INSTITUTION: "https://metiersdart-geneve.ch/images/2025/05/23/institutions.png",
};

export function PoinconBadge({ type, modalText, modalLink, variant = "badge" }: Props) {
  const [open, setOpen] = useState(false);
  const label = poinconLabels[type] ?? type;
  const imgSrc = poinconImages[type];

  return (
    <>
      {variant === "badge" ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-mag-red/30 bg-mag-cream/40 px-3 py-1.5 text-sm font-medium text-mag-red hover:bg-mag-red hover:text-white transition-colors"
          aria-label={`Poinçon ${label} — cliquer pour en savoir plus`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          Poinçon {label}
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="group relative w-full overflow-hidden rounded-xl border border-mag-cream hover:border-mag-red/40 transition-colors"
          aria-label={`Poinçon ${label} — cliquer pour en savoir plus`}
        >
          <div className="relative aspect-square w-full">
            {imgSrc && (
              <Image
                src={imgSrc}
                alt={`Poinçon ${label}`}
                fill
                sizes="200px"
                className="object-contain p-4"
                unoptimized
              />
            )}
          </div>
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-mag-dark opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
              En savoir plus
            </span>
          </span>
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Poinçon ${label}`}
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
              {imgSrc && (
                <div className="relative w-14 h-14 shrink-0">
                  <Image
                    src={imgSrc}
                    alt={`Poinçon ${label}`}
                    width={56}
                    height={56}
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
              <h3 className="text-lg font-bold text-mag-dark font-serif">
                Poinçon {label}
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
