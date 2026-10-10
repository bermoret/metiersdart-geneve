"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { ANNONCE_CATEGORIES as CATEGORIES, ANNONCE_PHOTO_TYPES } from "@/lib/annonces";
import { downscaleImage } from "@/lib/image-resize";
import { canOptimizeImage } from "@/lib/utils";

type Annonce = {
  id: string;
  title: string;
  category: string;
  authorName: string;
  content: string;
  imageUrl: string | null;
  publishedAt: string | null;
};

export default function CommunautePage() {
  const [status, setStatus] = useState<"checking" | "anon" | "authed">("checking");
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Formulaire de soumission
  const [fTitle, setFTitle] = useState("");
  const [fCategory, setFCategory] = useState<string>(CATEGORIES[0]);
  // Photo facultative : réduite dans le navigateur, aperçu local
  const [fPhoto, setFPhoto] = useState<{ blob: Blob; type: string; name: string; preview: string } | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [fAuthor, setFAuthor] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fContent, setFContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ text: string; error: boolean } | null>(null);

  // Charge la liste ; "denied" si la session n'est pas (ou plus) valide
  const loadAnnonces = useCallback(async (): Promise<"ok" | "denied" | "error"> => {
    try {
      const res = await fetch("/api/annonces", { cache: "no-store" });
      if (res.status === 401) return "denied";
      const data = res.ok ? await res.json() : [];
      setAnnonces(Array.isArray(data) ? data : []);
      return res.ok ? "ok" : "error";
    } catch {
      setAnnonces([]);
      return "error";
    } finally {
      setLoading(false);
    }
  }, []);

  // Au montage, la liste sert de contrôle de session (cookie httpOnly)
  useEffect(() => {
    loadAnnonces().then((r) => {
      setStatus(r === "ok" ? "authed" : "anon");
      if (r === "error") setAuthError("Service momentanément indisponible, réessayez plus tard");
    });
  }, [loadAnnonces]);

  const refresh = async () => {
    setLoading(true);
    if ((await loadAnnonces()) === "denied") {
      // Mot de passe accepté mais cookie absent au retour : cookies bloqués
      setStatus("anon");
      setAuthError("Impossible d'ouvrir la session (cookies bloqués ?)");
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/communaute/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setStatus("authed");
        void refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setAuthError(data.error || "Accès refusé");
      }
    } catch {
      setAuthError("Erreur de connexion");
    } finally {
      setVerifying(false);
    }
  };

  const handleQuit = async () => {
    const ok = await fetch("/api/communaute/verify", { method: "DELETE" })
      .then((r) => r.ok)
      .catch(() => false);
    // Cookie non effacé : on reste dans l'espace plutôt que de feindre la sortie
    if (!ok) {
      setSubmitMsg({ text: "Déconnexion impossible, réessayez.", error: true });
      return;
    }
    setStatus("anon");
    setAnnonces([]);
    setPassword("");
    setShowForm(false);
    setSubmitMsg(null);
    setAuthError(null);
  };

  const handlePhoto = async (file: File | undefined) => {
    setPhotoError(null);
    if (fPhoto) URL.revokeObjectURL(fPhoto.preview);
    setFPhoto(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Choisissez une image (JPEG, PNG ou WebP).");
      return;
    }
    const reduced = await downscaleImage(file);
    if (!(reduced.type in ANNONCE_PHOTO_TYPES)) {
      setPhotoError("Format non pris en charge par votre navigateur : utilisez une photo JPEG ou PNG.");
      return;
    }
    if (reduced.blob.size > 4 * 1024 * 1024) {
      setPhotoError("Photo trop volumineuse (4 Mo maximum).");
      return;
    }
    setFPhoto({ ...reduced, preview: URL.createObjectURL(reduced.blob) });
  };

  const clearPhoto = () => {
    if (fPhoto) URL.revokeObjectURL(fPhoto.preview);
    setFPhoto(null);
    setPhotoError(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!fTitle.trim() || !fContent.trim() || !fAuthor.trim()) return;
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      // multipart : champs texte + photo réduite (facultative)
      const fd = new FormData();
      fd.append("title", fTitle);
      fd.append("category", fCategory);
      fd.append("authorName", fAuthor);
      fd.append("authorEmail", fEmail);
      fd.append("content", fContent);
      if (fPhoto) fd.append("photo", fPhoto.blob, fPhoto.name);
      const res = await fetch("/api/annonces", { method: "POST", body: fd });
      if (res.status === 401) {
        setStatus("anon");
        setAuthError("Session expirée, saisissez à nouveau le mot de passe");
        setShowForm(false);
      } else if (res.ok) {
        setSubmitMsg({
          text: "Votre annonce a été soumise. Elle sera visible après validation par MAG.",
          error: false,
        });
        setFTitle("");
        setFCategory(CATEGORIES[0]);
        setFAuthor("");
        setFEmail("");
        setFContent("");
        clearPhoto();
        setShowForm(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setSubmitMsg({
          text: data.error || (res.status === 413 ? "Photo trop volumineuse pour l'envoi." : "Erreur lors de la soumission."),
          error: true,
        });
      }
    } catch {
      setSubmitMsg({ text: "Erreur de connexion", error: true });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Vérification de session ────────────────────────────────
  if (status === "checking") {
    return (
      <section className="py-20 bg-mag-sand grain-overlay min-h-[60vh] flex items-center">
        <div className="mx-auto max-w-md w-full px-4">
          <div className="rounded-2xl border border-mag-cream bg-white p-8 shadow-lg">
            <h1 className="text-4xl font-black tracking-tight text-mag-dark font-serif mb-3 text-center">
              Espace Communauté
            </h1>
            <p className="text-sm text-mag-gray text-center">Vérification…</p>
          </div>
        </div>
      </section>
    );
  }

  // ─── Écran de connexion ─────────────────────────────────────
  if (status === "anon") {
    return (
      <section className="py-20 bg-mag-sand grain-overlay min-h-[60vh] flex items-center">
        <div className="mx-auto max-w-md w-full px-4">
          <div className="rounded-2xl border border-mag-cream bg-white p-8 shadow-lg">
            <h1 className="text-4xl font-black tracking-tight text-mag-dark font-serif mb-3 text-center">
              Espace Communauté
            </h1>
            <p className="text-sm text-mag-gray mb-6 text-center">
              Accès réservé aux artisan·e·s membres de MAG.
              Saisissez le mot de passe communiqué par l&apos;association.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              placeholder="Mot de passe"
              className="w-full rounded-lg border border-mag-field bg-white px-4 py-3 text-sm focus:border-mag-red focus:outline-none focus:ring-2 focus:ring-mag-red/20"
              autoFocus
            />
            {authError && (
              <p className="mt-3 text-sm text-red-700">{authError}</p>
            )}
            <button
              onClick={handleVerify}
              disabled={verifying || !password.trim()}
              className="mt-4 w-full rounded-full bg-mag-red px-6 py-3 text-sm font-semibold text-white hover:bg-mag-red-dark transition-colors disabled:opacity-50 cursor-pointer"
            >
              {verifying ? "Vérification…" : "Accéder à l'espace"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ─── Espace connecté ────────────────────────────────────────
  return (
    <>
      <section className="bg-mag-sand grain-overlay border-b border-mag-cream py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="mb-5 text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] text-mag-red">
                ✦&nbsp;&nbsp;Réservé aux membres
              </p>
              <h1 className="font-serif font-black tracking-tight leading-[0.95] text-mag-dark text-5xl sm:text-6xl lg:text-7xl">
                Espace Communauté
              </h1>
              <p className="mt-8 text-lg text-mag-dark/80 leading-relaxed max-w-2xl">
                Petites annonces entre artisan·e·s de MAG : ventes de matériel,
                recherche d&apos;un artisan pour un marché, opportunités
                professionnelles, collaborations, événements, expositions, conseils,
                entraide. Toute annonce est validée par MAG avant publication.
              </p>
            </div>
            <button
              onClick={handleQuit}
              className="shrink-0 inline-flex items-center gap-2 rounded-full border border-mag-cream bg-white px-4 py-2 text-sm font-medium text-mag-dark/70 hover:border-mag-red hover:text-mag-red transition-colors cursor-pointer"
            >
              <i className="fas fa-sign-out-alt" /> Quitter
            </button>
          </div>
        </div>
      </section>

      {/* Annonces */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="h-section">
              Annonces ({loading ? "…" : annonces.length})
            </h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 rounded-full bg-mag-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-mag-red-dark transition-colors cursor-pointer"
            >
              <i className="fas fa-plus" /> {showForm ? "Annuler" : "Publier une annonce"}
            </button>
          </div>

          {submitMsg && (
            <div
              className={`mb-6 rounded-xl border px-5 py-4 text-sm ${
                submitMsg.error
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-green-50 border-green-200 text-green-700"
              }`}
            >
              {submitMsg.text}
            </div>
          )}

          {/* Formulaire de soumission */}
          {showForm && (
            <Reveal>
              <div className="mb-10 rounded-2xl border border-mag-cream bg-mag-sand/40 p-6">
                <h3 className="font-bold text-mag-dark mb-4">Nouvelle annonce</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label>
                    <span className="text-xs font-medium text-mag-gray mb-1 block">Titre *</span>
                    <input
                      type="text"
                      value={fTitle}
                      onChange={(e) => setFTitle(e.target.value)}
                      className="w-full rounded-lg border border-mag-field bg-white px-3 py-2 text-sm focus:border-mag-red focus:outline-none focus:ring-2 focus:ring-mag-red/20"
                    />
                  </label>
                  <label>
                    <span className="text-xs font-medium text-mag-gray mb-1 block">Catégorie *</span>
                    <select
                      value={fCategory}
                      onChange={(e) => setFCategory(e.target.value)}
                      className="w-full rounded-lg border border-mag-field bg-white px-3 py-2 text-sm focus:border-mag-red focus:outline-none"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="text-xs font-medium text-mag-gray mb-1 block">Votre nom *</span>
                    <input
                      type="text"
                      value={fAuthor}
                      onChange={(e) => setFAuthor(e.target.value)}
                      className="w-full rounded-lg border border-mag-field bg-white px-3 py-2 text-sm focus:border-mag-red focus:outline-none focus:ring-2 focus:ring-mag-red/20"
                    />
                  </label>
                  <label>
                    <span className="text-xs font-medium text-mag-gray mb-1 block">E-mail (facultatif)</span>
                    <input
                      type="email"
                      value={fEmail}
                      onChange={(e) => setFEmail(e.target.value)}
                      className="w-full rounded-lg border border-mag-field bg-white px-3 py-2 text-sm focus:border-mag-red focus:outline-none focus:ring-2 focus:ring-mag-red/20"
                    />
                  </label>
                  <label className="col-span-2">
                    <span className="text-xs font-medium text-mag-gray mb-1 block">Contenu *</span>
                    <textarea
                      value={fContent}
                      onChange={(e) => setFContent(e.target.value)}
                      rows={5}
                      className="w-full rounded-lg border border-mag-field bg-white px-3 py-2 text-sm focus:border-mag-red focus:outline-none focus:ring-2 focus:ring-mag-red/20"
                    />
                  </label>
                  <div className="col-span-2">
                    <span className="text-xs font-medium text-mag-gray mb-1 block">Photo (facultative)</span>
                    <div className="flex items-center gap-4">
                      {fPhoto && (
                        // eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob:) avant envoi
                        <img src={fPhoto.preview} alt="Aperçu de la photo" className="h-20 w-20 rounded-lg object-cover border border-mag-cream" />
                      )}
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => void handlePhoto(e.target.files?.[0])}
                        className="text-sm text-mag-dark/70 file:mr-3 file:rounded-full file:border-0 file:bg-mag-cream file:px-4 file:py-2 file:text-sm file:font-medium file:text-mag-dark hover:file:bg-mag-cream/70"
                      />
                      {fPhoto && (
                        <button type="button" onClick={clearPhoto} className="text-xs text-mag-gray hover:text-red-700 cursor-pointer">
                          Retirer
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-mag-gray">
                      JPEG, PNG ou WebP. La photo est réduite avant l&apos;envoi (1600 px maximum).
                    </p>
                    {photoError && <p className="mt-1 text-xs text-red-700">{photoError}</p>}
                  </div>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !fTitle.trim() || !fContent.trim() || !fAuthor.trim()}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-mag-red px-6 py-2.5 text-sm font-semibold text-white hover:bg-mag-red-dark transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Envoi…" : "Soumettre pour validation"}
                </button>
                <p className="mt-3 text-xs text-mag-gray">
                  Votre annonce sera examinée par MAG avant d&apos;être publiée.
                </p>
              </div>
            </Reveal>
          )}

          {/* Liste des annonces */}
          {loading ? (
            <p className="text-mag-gray">Chargement…</p>
          ) : annonces.length === 0 ? (
            <p className="text-center text-mag-gray py-12">
              Aucune annonce publiée pour le moment.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {annonces.map((a) => (
                <div key={a.id} className="rounded-xl border border-mag-cream bg-white p-6 card-hover">
                  {a.imageUrl && (
                    <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-lg bg-mag-cream/40">
                      <Image
                        src={a.imageUrl}
                        unoptimized={!canOptimizeImage(a.imageUrl)}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <span className="inline-block rounded-full bg-mag-cream/60 px-3 py-1 text-xs font-medium text-mag-dark/80 mb-3">
                    {a.category}
                  </span>
                  <h3 className="font-bold text-mag-dark mb-2">{a.title}</h3>
                  <p className="text-sm text-mag-dark/70 leading-relaxed whitespace-pre-line line-clamp-6">
                    {a.content}
                  </p>
                  <div className="mt-4 pt-3 border-t border-mag-cream/60 flex items-center justify-between text-xs text-mag-gray">
                    <span>Par {a.authorName}</span>
                    {a.publishedAt && (
                      <span>{new Date(a.publishedAt).toLocaleDateString("fr-FR")}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
