// Middleware léger pour la protection des routes admin.
// On ne peut pas importer `auth` depuis @/auth car il tire `pg`
// (Node-only) dans le bundle Edge. On utilise donc uniquement
// le cookie de session NextAuth côté Edge — sans requêter la DB.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes protégées par authentification
const protectedPaths = ["/admin"];

export function middleware(request: NextRequest) {
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
