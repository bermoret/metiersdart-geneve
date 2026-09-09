import Link from "next/link";

export const metadata = {
  title: "Erreur — MAG",
};

export default function ErrorPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-black text-mag-red mb-4">Erreur</h1>
        <p className="text-mag-dark/70 mb-6">
          Une erreur est survenue lors de l&apos;authentification.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-mag-red px-6 py-3 text-sm font-semibold text-white hover:bg-mag-red-dark transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
