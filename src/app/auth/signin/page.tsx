import { SignInForm } from "./SignInForm";

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

        <SignInForm />
      </div>
    </div>
  );
}
