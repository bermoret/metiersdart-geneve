import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/admin");
  }
  return session;
}

export async function requireAdminApi() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  return session;
}
