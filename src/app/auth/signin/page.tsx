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
      </div>
    </div>
  );
}
