"use server";

import { signIn } from "@/auth";

export async function handleSignIn(formData: FormData) {
  const email = formData.get("email") as string;
  await signIn("resend", { email, redirectTo: "/admin" });
}
