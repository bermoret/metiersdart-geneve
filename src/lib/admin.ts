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
