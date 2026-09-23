"use client";

import { useState, useEffect } from "react";
import { Reveal } from "@/components/ui/Reveal";

type Annonce = {
  id: string;
  title: string;
  category: string;
  authorName: string;
  content: string;
  publishedAt: string | null;
};

const CATEGORIES = [
  "Vente de matériel",
  "Recherche d'artisan",
  "Opportunités professionnelles",
  "Collaborations",
  "Événements",
  "Expositions",
  "Conseils et ressources",
  "Retours d'expérience",
  "Entraide",
];

export default function CommunautePage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Formulaire de soumission
  const [fTitle, setFTitle] = useState("");
  const [fCategory, setFCategory] = useState(CATEGORIES[0]);
  const [fAuthor, setFAuthor] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fContent, setFContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!authed) return;
    fetch("/api/annonces")
      .then((r) => r.json())
      .then((data) => {
        setAnnonces(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setAnnonces([]);
        setLoading(false);
      });
  }, [authed]);

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
        setAuthed(true);
      } else {
        const data = await res.json();
        setAuthError(data.error || "Accès refusé");
      }
    } catch {
      setAuthError("Erreur de connexion");
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async () => {
    if (!fTitle.trim() || !fContent.trim() || !fAuthor.trim()) return;
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const res = await fetch("/api/annonces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fTitle,
          category: fCategory,
          authorName: fAuthor,
          authorEmail: fEmail,
          content: fContent,
        }),
      });
      if (res.ok) {
        setSubmitMsg("Votre annonce a été soumise. Elle sera visible après validation par MAG.");
        setFTitle("");
        setFCategory(CATEGORIES[0]);
        setFAuthor("");
        setFEmail("");
        setFContent("");
        setShowForm(false);
      } else {
        setSubmitMsg("Erreur lors de la soumission.");
      }
    } catch {
      setSubmitMsg("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Écran de connexion ─────────────────────────────────────
  if (!authed) {
    return (
      <section className="py-20 bg-gradient-to-b from-mag-cream/60 to-white min-h-[60vh] flex items-center">
        <div className="mx-auto max-w-md w-full px-4">
          <div className="rounded-2xl border border-mag-cream bg-white p-8 shadow-lg">
            <h1 className="text-2xl font-black text-mag-dark font-serif mb-2 text-center">
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
      <section className="bg-gradient-to-b from-mag-cream/60 to-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-mag-dark font-serif">
                Espace Communauté
              </h1>
              <p className="mt-3 text-mag-dark/80 leading-relaxed max-w-2xl">
                Petites annonces entre artisan·e·s de MAG : ventes de matériel,
                recherche d&apos;un artisan pour un marché, opportunités
                professionnelles, collaborations, événements, expositions, conseils,
                entraide. Toute annonce est validée par MAG avant publication.
              </p>
            </div>
            <button
              onClick={() => setAuthed(false)}
              className="shrink-0 inline-flex items-center gap-2 rounded-full border border-mag-cream px-4 py-2 text-sm font-medium text-mag-dark/70 hover:border-mag-red hover:text-mag-red transition-colors cursor-pointer"
            >
              <i className="fas fa-sign-out-alt" /> Quitter
            </button>
          </div>
        </div>
      </section>

      {/* Annonces */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-mag-dark font-serif">
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
            <div className="mb-6 rounded-xl bg-green-50 border border-green-200 px-5 py-4 text-sm text-green-700">
              {submitMsg}
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
