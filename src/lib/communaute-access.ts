// Contrôle d'accès serveur de l'Espace Communauté (cookie signé, cf. communaute-token).

import { hkdfSync } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { ACCESS_TTL_MS, createRateLimiter, verifyAccess } from "./communaute-token";

export const COMMUNAUTE_COOKIE = "mag_communaute";

// Tentatives de mot de passe par IP (route verify) et soumissions d'annonces
// par IP (chacune envoie un mail à MAG)
export const verifyLimiter = createRateLimiter({ max: 10, windowMs: 15 * 60 * 1000 });
export const submitLimiter = createRateLimiter({ max: 5, windowMs: 60 * 60 * 1000 });

/** Clé HMAC dérivée d'AUTH_SECRET (propre à cet usage, distincte de next-auth). */
export function communauteKey(): string | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return Buffer.from(hkdfSync("sha256", secret, "", "mag-communaute-v1", 32)).toString("base64url");
}

export async function loadCommunautePassword(): Promise<string | null> {
  const [row] = await db
    .select({ password: siteSettings.communautePassword })
    .from(siteSettings)
    .where(eq(siteSettings.id, "default"))
    .limit(1);
  return row?.password || null;
}

/**
 * Fail-closed : pas de cookie, de secret ou de mot de passe configuré → "denied".
 * Base injoignable → "unavailable" (503 côté route, et non une 500 muette).
 */
export async function communauteAccess(
  req: NextRequest,
): Promise<"ok" | "denied" | "unavailable"> {
  const value = req.cookies.get(COMMUNAUTE_COOKIE)?.value;
  if (!value) return "denied";
  const key = communauteKey();
  if (!key) return "denied";
  let password: string | null;
  try {
    password = await loadCommunautePassword();
  } catch (err) {
    console.error("[communaute] lecture du mot de passe impossible :", err);
    return "unavailable";
  }
  if (!password) return "denied";
  return verifyAccess(key, password, value, Date.now()) ? "ok" : "denied";
}

const cookieAttrs = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setAccessCookie(res: NextResponse, value: string): NextResponse {
  res.cookies.set(COMMUNAUTE_COOKIE, value, { ...cookieAttrs, maxAge: ACCESS_TTL_MS / 1000 });
  return res;
}

export function clearAccessCookie(res: NextResponse): NextResponse {
  res.cookies.set(COMMUNAUTE_COOKIE, "", { ...cookieAttrs, maxAge: 0 });
  return res;
}

export function noStore(res: NextResponse): NextResponse {
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}
