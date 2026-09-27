// Proxy léger (ex-middleware, renommé en Next 16) pour la protection des
// routes admin. Il tourne en runtime Node.js, mais on reste volontairement
// sans import de `auth` / `db` : pas de connexion Postgres à chaque requête,
// on ne regarde que la présence du cookie de session NextAuth. La vraie
// vérification (session en DB, rôle admin) se fait dans les pages et les
// route handlers eux-mêmes.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Le proxy ne tourne que sur /admin (voir `matcher`) : en Next 16 il s'exécute
// en Node, il ne doit pas précéder chaque page publique servie depuis le cache.
// Les routes /api/admin vérifient elles-mêmes la session (requireAdminApi).
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  matcher: ["/admin", "/admin/:path*"],
};
