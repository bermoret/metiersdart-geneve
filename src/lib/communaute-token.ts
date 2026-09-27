// Jeton d'accès à l'Espace Communauté : cookie signé HMAC, sans état serveur.
// La signature couvre le mot de passe stocké : le changer dans l'admin (ou
// changer AUTH_SECRET) invalide tous les cookies émis.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ACCESS_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest();

/** Comparaison à temps constant (digests de même longueur). */
export function passwordMatches(input: string, expected: string): boolean {
  return timingSafeEqual(sha256(input), sha256(expected));
}

function sign(secret: string, password: string, expMs: number): string {
  return createHmac("sha256", secret)
    .update(`communaute:v1:${expMs}:${password}`, "utf8")
    .digest("base64url");
}

export function signAccess(secret: string, password: string, expMs: number): string {
  return `${expMs}.${sign(secret, password, expMs)}`;
}

export function verifyAccess(
  secret: string,
  password: string,
  value: string,
  nowMs: number,
): boolean {
  try {
    if (!/^\d+\.[A-Za-z0-9_-]+$/.test(value)) return false;
    const [expStr, sig] = value.split(".");
    const exp = Number(expStr);
    if (!Number.isSafeInteger(exp) || exp <= nowMs) return false;
    const given = Buffer.from(sig, "utf8");
    const wanted = Buffer.from(sign(secret, password, exp), "utf8");
    return given.length === wanted.length && timingSafeEqual(given, wanted);
  } catch {
    return false;
  }
}

/** IP du client derrière le proxy Vercel. */
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const first = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return first || "unknown";
}

/**
 * Limiteur en mémoire, fenêtre fixe par clé ouverte à la première tentative.
 * `hit` compte la tentative au moment du contrôle (sans await entre les deux) :
 * une rafale de requêtes parallèles ne passe pas sous le plafond.
 * Par instance serverless : un frein, pas une garantie globale.
 */
export function createRateLimiter({
  max,
  windowMs,
  maxKeys = 10_000,
  now = Date.now,
}: {
  max: number;
  windowMs: number;
  maxKeys?: number;
  now?: () => number;
}) {
  // Ordre d'insertion = ordre de resetAt (fenêtre fixe, jamais prolongée) :
  // la purge s'arrête à la première entrée encore active.
  const hits = new Map<string, { count: number; resetAt: number }>();

  const purge = (t: number) => {
    for (const [k, e] of hits) {
      if (e.resetAt > t) break;
      hits.delete(k);
    }
  };

  return {
    hit(key: string): { ok: boolean; retryAfterMs: number } {
      const t = now();
      purge(t);
      let e = hits.get(key);
      // Horloge qui recule : une fenêtre échue peut rester derrière une active
      if (e && e.resetAt <= t) {
        hits.delete(key);
        e = undefined;
      }
      if (e && e.count >= max) return { ok: false, retryAfterMs: e.resetAt - t };
      if (e) e.count++;
      else {
        if (hits.size >= maxKeys) hits.delete(hits.keys().next().value!);
        hits.set(key, { count: 1, resetAt: t + windowMs });
      }
      return { ok: true, retryAfterMs: 0 };
    },
    reset(key: string): void {
      hits.delete(key);
    },
  };
}
