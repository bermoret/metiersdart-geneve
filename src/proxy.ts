// Proxy léger (ex-middleware, renommé en Next 16) pour la protection des
// routes admin. Il tourne en runtime Node.js, mais on reste volontairement
// sans import de `auth` / `db` : pas de connexion Postgres à chaque requête,
// on ne regarde que la présence du cookie de session NextAuth. La vraie
// vérification (session en DB, rôle admin) se fait dans les pages et les
// route handlers eux-mêmes.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes protégées par authentification
const protectedPaths = ["/admin", "/api/admin"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Vérifier la présence du cookie de session NextAuth
  const sessionToken =
    request.cookies.get("authjs.session-token") ??
    request.cookies.get("__Secure-authjs.session-token");

  if (!sessionToken) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
