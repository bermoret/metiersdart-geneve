"use client";

import { useState, useTransition } from "react";
import { handleSignIn } from "./actions";

export function SignInForm() {
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        setLoading(true);
        startTransition(() => {
          handleSignIn(formData);
        });
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
        disabled={loading}
        className="w-full rounded-full bg-mag-red px-4 py-3 text-sm font-semibold text-white hover:bg-mag-red-dark transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Envoi en cours…
          </>
        ) : (
          "Recevoir un lien de connexion"
        )}
      </button>
    </form>
  );
}
