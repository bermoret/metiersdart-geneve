import { NextRequest, NextResponse } from "next/server";
import {
  clearAccessCookie,
  communauteKey,
  loadCommunautePassword,
  noStore,
  setAccessCookie,
  verifyLimiter,
} from "@/lib/communaute-access";
import {
  ACCESS_TTL_MS,
  clientIp,
  passwordMatches,
  signAccess,
} from "@/lib/communaute-token";

const reply = (body: unknown, status = 200) => noStore(NextResponse.json(body, { status }));

// POST /api/communaute/verify — vérifie le mot de passe commun et pose le cookie d'accès
export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  // Chaque tentative compte dès ici (avant tout await) ; remise à zéro si succès
  const limit = verifyLimiter.hit(ip);
  if (!limit.ok) {
    const seconds = Math.ceil(limit.retryAfterMs / 1000);
    const minutes = Math.max(1, Math.ceil(limit.retryAfterMs / 60_000));
    const res = reply({ error: `Trop de tentatives, réessayez dans ${minutes} min` }, 429);
    res.headers.set("Retry-After", String(seconds));
    return res;
  }

  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password.trim() : "";
  if (!password) return reply({ error: "Mot de passe requis" }, 400);
  if (password.length > 255) return reply({ error: "Mot de passe incorrect" }, 401);

  const key = communauteKey();
  if (!key) {
    console.error("[communaute] AUTH_SECRET manquant");
    return reply({ error: "Configuration manquante" }, 500);
  }

  let expected: string | null;
  try {
    expected = await loadCommunautePassword();
  } catch (err) {
    console.error("[communaute] lecture du mot de passe impossible :", err);
    return reply({ error: "Service momentanément indisponible" }, 503);
  }
  // Si aucun mot de passe n'est configuré, on refuse l'accès
  if (!expected) return reply({ error: "Accès non configuré" }, 403);

  if (!passwordMatches(password, expected)) {
    return reply({ error: "Mot de passe incorrect" }, 401);
  }

  verifyLimiter.reset(ip);
  return setAccessCookie(reply({ ok: true }), signAccess(key, expected, Date.now() + ACCESS_TTL_MS));
}

// DELETE /api/communaute/verify — « Quitter » : efface le cookie d'accès
export async function DELETE() {
  return clearAccessCookie(reply({ ok: true }));
}
