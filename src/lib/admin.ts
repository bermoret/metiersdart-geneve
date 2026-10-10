import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/admin");
  }
  if (session.user.role !== "admin") {
    redirect("/");
  }
  return session;
}

export async function requireAdminApi() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  if (session.user.role !== "admin") {
    return null;
  }
  return session;
}

/** Auteur inscrit dans les journaux (nom, sinon e-mail) pour une session admin. */
export function sessionAuthor(session: { user?: object | null } | null): string {
  const u = (session?.user ?? {}) as { name?: unknown; email?: unknown };
  const name = typeof u.name === "string" ? u.name.trim() : "";
  const email = typeof u.email === "string" ? u.email.trim() : "";
  return (name || email || "admin").slice(0, 255);
}
