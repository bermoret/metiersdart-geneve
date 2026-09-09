export const metadata = {
  title: "Vérification — MAG",
};

export default function VerifyRequestPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6">
          <svg
            className="mx-auto w-16 h-16 text-mag-red"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M22 10.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L2 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-mag-dark font-serif mb-3">
          Vérifiez votre boîte mail
        </h1>
        <p className="text-mag-dark/70 leading-relaxed">
          Un lien de connexion vient d&apos;être envoyé à votre adresse e-mail.
          Cliquez dessus pour vous connecter à votre espace MAG.
        </p>
        <p className="mt-4 text-sm text-mag-gray">
          Le lien expirera dans 24 heures.
        </p>
      </div>
    </div>
  );
}
