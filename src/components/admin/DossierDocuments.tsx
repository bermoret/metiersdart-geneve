"use client";

// Pièces justificatives d'un dossier : envoi direct navigateur → Vercel Blob
// en accès PRIVÉ (jeton borné par /documents/upload), puis enregistrement
// côté serveur (/documents, qui vérifie type, taille et confidentialité).
// Lecture et suppression passent toujours par la route admin.

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { DOCUMENT_CONTENT_TYPES, DOCUMENT_KINDS, DOCUMENT_MAX_BYTES, documentPathname, isAllowedContentType } from "@/lib/dossier-documents";
import { formatDay as day } from "@/lib/dates";

export type DocumentRow = {
  id: string;
  label: string;
  kind: string;
  contentType: string;
  size: number;
  uploadedBy: string | null;
  uploadedAt: string;
};

const fmtSize = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} Mo` : `${Math.max(1, Math.round(n / 1024))} Ko`);

export function DossierDocuments({ dossierId, documents, onChanged }: { dossierId: string; documents: DocumentRow[]; onChanged: () => Promise<void> | void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<string>("attestation_avs");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    if (!isAllowedContentType(file.type)) {
      setError("Formats admis : PDF, JPEG, PNG, WebP.");
      return;
    }
    if (file.size > DOCUMENT_MAX_BYTES) {
      setError("Pièce trop volumineuse (10 Mo maximum).");
      return;
    }
    const pathname = documentPathname(dossierId, file.name, file.type);
    if (!pathname) {
      setError("Nom de fichier non admis.");
      return;
    }
    setBusy("Envoi…");
    try {
      const blob = await upload(pathname, file, {
        access: "private",
        contentType: file.type,
        handleUploadUrl: `/api/admin/dossiers/${dossierId}/documents/upload`,
      });
      setBusy("Enregistrement…");
      const res = await fetch(`/api/admin/dossiers/${dossierId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathname: blob.pathname, kind, label: label.trim() || file.name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Enregistrement de la pièce impossible");
      setLabel("");
      if (fileRef.current) fileRef.current.value = "";
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (doc: DocumentRow) => {
    if (!confirm(`Supprimer la pièce « ${doc.label} » ?`)) return;
    setError(null);
    const res = await fetch(`/api/admin/dossiers/${dossierId}/documents/${doc.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Suppression impossible");
      return;
    }
    await onChanged();
  };

  const kindLabel = (k: string) => DOCUMENT_KINDS.find((d) => d.value === k)?.label ?? k;

  return (
    <section className="mb-6 rounded-xl border border-mag-cream bg-white p-5">
      <h2 className="text-base font-bold text-mag-dark font-serif">Pièces justificatives</h2>
      <p className="mt-1 mb-3 text-sm text-mag-gray">
        Attestation AVS, extrait du RC, CV… Stockage privé : ces fichiers ne sont lisibles que depuis l’admin. PDF, JPEG, PNG ou WebP, 10 Mo maximum.
      </p>

      {documents.length > 0 && (
        <ul className="mb-4 divide-y divide-mag-cream/60 rounded-lg border border-mag-cream">
          {documents.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
              <i className={`${d.contentType === "application/pdf" ? "fas fa-file-pdf" : "fas fa-file-image"} text-mag-red`} aria-hidden />
              <span className="font-medium text-mag-dark">{d.label}</span>
              <span className="text-mag-gray">{kindLabel(d.kind)} · {fmtSize(d.size)} · {day(d.uploadedAt)}{d.uploadedBy ? ` · ${d.uploadedBy}` : ""}</span>
              <span className="ml-auto flex items-center gap-3">
                <a href={`/api/admin/dossiers/${dossierId}/documents/${d.id}`} target="_blank" rel="noreferrer" className="text-mag-red hover:underline">
                  Ouvrir
                </a>
                <a href={`/api/admin/dossiers/${dossierId}/documents/${d.id}?download=1`} className="text-mag-red hover:underline">
                  Télécharger
                </a>
                <button type="button" onClick={() => handleDelete(d)} className="text-mag-gray hover:text-red-700 cursor-pointer" aria-label={`Supprimer ${d.label}`}>
                  <i className="fas fa-trash" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-mag-gray">Type de pièce</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-lg border border-mag-field bg-white px-3 py-2 text-sm focus:border-mag-red focus:outline-none">
            {DOCUMENT_KINDS.map((k) => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>
        </label>
        <label className="block flex-1 min-w-48">
          <span className="mb-1 block text-xs font-medium text-mag-gray">Libellé (facultatif)</span>
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex. Attestation Ocas 2026" className="w-full rounded-lg border border-mag-field bg-white px-3 py-2 text-sm focus:border-mag-red focus:outline-none" />
        </label>
        <input
          ref={fileRef}
          type="file"
          accept={Object.keys(DOCUMENT_CONTENT_TYPES).join(",")}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleUpload(f);
          }}
        />
        <button
          type="button"
          disabled={!!busy}
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-mag-cream px-4 py-2 text-sm font-medium text-mag-dark hover:border-mag-red hover:text-mag-red transition-colors disabled:opacity-50 cursor-pointer"
        >
          {busy ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-mag-gray/30 border-t-mag-red" />
              {busy}
            </>
          ) : (
            <>
              <i className="fas fa-upload" aria-hidden /> Ajouter une pièce
            </>
          )}
        </button>
      </div>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    </section>
  );
}
