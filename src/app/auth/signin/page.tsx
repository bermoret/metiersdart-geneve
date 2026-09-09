import { signIn } from "@/auth";

export const metadata = {
  title: "Connexion — MAG",
};

export default function SignInPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-mag-cream p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-mag-dark font-serif text-center mb-2">
          Espace MAG
        </h1>
        <p className="text-center text-sm text-mag-gray mb-8">
          Connectez-vous pour gérer le répertoire et les contenus.
        </p>

        {/* Lien magique */}
        <form
          action={async (formData) => {
            "use server";
            const email = formData.get("email") as string;
            await signIn("resend", { email, redirectTo: "/admin" });
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-mag-dark mb-1">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="contact@metiersdart-geneve.ch"
              className="w-full rounded-lg border border-mag-cream bg-white px-4 py-2.5 text-sm focus:border-mag-red focus:outline-none focus:ring-2 focus:ring-mag-red/20"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-mag-red px-4 py-3 text-sm font-semibold text-white hover:bg-mag-red-dark transition-colors"
          >
            Recevoir un lien de connexion
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-mag-cream/80">
          <p className="text-center text-xs text-mag-gray mb-4">
            ou utilisez un passkey
          </p>
          <form
            action={async () => {
              "use server";
              await signIn("passkey", { redirectTo: "/admin" });
            }}
          >
            <button
              type="submit"
              className="w-full rounded-lg border border-mag-cream px-4 py-3 text-sm font-medium text-mag-dark hover:border-mag-red hover:text-mag-red transition-colors flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              Se connecter avec un passkey
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
