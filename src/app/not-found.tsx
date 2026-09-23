import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 bg-mag-sand grain-overlay">
      <div className="text-center max-w-lg py-20">
        <p className="text-[9rem] sm:text-[12rem] leading-none font-black tracking-tight text-mag-red font-serif mb-6">404</p>
        <h1 className="text-4xl font-black text-mag-dark mb-4 font-serif">
          Page introuvable
        </h1>
        <p className="text-mag-dark/70 mb-8 leading-relaxed">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-mag-red px-6 py-3 text-sm font-semibold text-white hover:bg-mag-red-dark transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
