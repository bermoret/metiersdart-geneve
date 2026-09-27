import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import {
  ACCESS_TTL_MS,
  clientIp,
  createRateLimiter,
  passwordMatches,
  signAccess,
  verifyAccess,
} from "./communaute-token";

const SECRET = "secret-de-test";
const PWD = "atelier2026";
const NOW = 1_800_000_000_000;

describe("passwordMatches", () => {
  test("identique → true", () => {
    assert.equal(passwordMatches("atelier2026", "atelier2026"), true);
  });
  test("différent → false", () => {
    assert.equal(passwordMatches("atelier2025", "atelier2026"), false);
  });
  test("longueurs différentes → false, sans exception", () => {
    assert.equal(passwordMatches("a", "atelier2026"), false);
    assert.equal(passwordMatches("", "atelier2026"), false);
  });
});

describe("signAccess / verifyAccess", () => {
  const exp = NOW + ACCESS_TTL_MS;
  const token = signAccess(SECRET, PWD, exp);

  test("signature valide", () => {
    assert.match(token, /^\d+\.[A-Za-z0-9_-]+$/);
    assert.equal(verifyAccess(SECRET, PWD, token, NOW), true);
  });
  test("expirée", () => {
    assert.equal(verifyAccess(SECRET, PWD, token, exp), false);
    assert.equal(verifyAccess(SECRET, PWD, token, exp + 1), false);
  });
  test("mot de passe changé → invalide", () => {
    assert.equal(verifyAccess(SECRET, "nouveau", token, NOW), false);
  });
  test("secret changé → invalide", () => {
    assert.equal(verifyAccess("autre-secret", PWD, token, NOW), false);
  });
  test("valeurs malformées → false, sans exception", () => {
    const [expStr, sig] = token.split(".");
    const flipped = (sig[0] === "A" ? "B" : "A") + sig.slice(1);
    for (const v of [
      "",
      "sansPoint",
      `abc.${sig}`,
      `${expStr}.`,
      `.${sig}`,
      `${expStr}.${sig.slice(0, -2)}`,
      `${expStr}.${flipped}`,
      `${expStr}.${sig}x`,
      `${expStr}.${sig}.extra`,
      `${exp + 1000}.${sig}`,
    ]) {
      assert.equal(verifyAccess(SECRET, PWD, v, NOW), false, v);
    }
  });
});

describe("clientIp", () => {
  test("x-real-ip prioritaire", () => {
    const h = new Headers({ "x-real-ip": "1.2.3.4", "x-forwarded-for": "5.6.7.8" });
    assert.equal(clientIp(h), "1.2.3.4");
  });
  test("x-forwarded-for multi-valeurs avec espaces → premier élément", () => {
    const h = new Headers({ "x-forwarded-for": "  9.9.9.9 , 10.0.0.1, 10.0.0.2" });
    assert.equal(clientIp(h), "9.9.9.9");
  });
  test("absent → unknown", () => {
    assert.equal(clientIp(new Headers()), "unknown");
  });
});

describe("createRateLimiter", () => {
  const setup = (maxKeys?: number) => {
    let t = NOW;
    const limiter = createRateLimiter({ max: 3, windowMs: 60_000, maxKeys, now: () => t });
    return { limiter, advance: (ms: number) => (t += ms) };
  };

  test("la tentative au-delà du plafond est bloquée, sans étape « échec » séparée", () => {
    const { limiter, advance } = setup();
    for (let i = 0; i < 3; i++) assert.equal(limiter.hit("ip").ok, true);
    advance(10_000);
    assert.deepEqual(limiter.hit("ip"), { ok: false, retryAfterMs: 50_000 });
  });
  test("se libère après la fenêtre", () => {
    const { limiter, advance } = setup();
    for (let i = 0; i < 3; i++) limiter.hit("ip");
    advance(59_999);
    assert.equal(limiter.hit("ip").ok, false);
    advance(1);
    assert.deepEqual(limiter.hit("ip"), { ok: true, retryAfterMs: 0 });
  });
  test("reset libère", () => {
    const { limiter } = setup();
    for (let i = 0; i < 3; i++) limiter.hit("ip");
    limiter.reset("ip");
    assert.equal(limiter.hit("ip").ok, true);
  });
  test("clés indépendantes", () => {
    const { limiter } = setup();
    for (let i = 0; i < 3; i++) limiter.hit("a");
    assert.equal(limiter.hit("a").ok, false);
    assert.equal(limiter.hit("b").ok, true);
  });
  test("plafond de clés : la plus ancienne est évincée", () => {
    const { limiter, advance } = setup(2);
    for (let i = 0; i < 3; i++) limiter.hit("a");
    advance(1);
    limiter.hit("b");
    limiter.hit("c");
    assert.equal(limiter.hit("a").ok, true);
  });
  test("horloge qui recule : une fenêtre échue derrière une active ne bloque pas", () => {
    const { limiter, advance } = setup();
    advance(100_000);
    limiter.hit("a");
    advance(-100_000);
    for (let i = 0; i < 3; i++) limiter.hit("b");
    advance(60_000);
    assert.equal(limiter.hit("b").ok, true);
  });
  test("purge des fenêtres expirées, les suivantes restent comptées", () => {
    const { limiter, advance } = setup();
    for (let i = 0; i < 3; i++) limiter.hit("a");
    advance(30_000);
    for (let i = 0; i < 3; i++) limiter.hit("b");
    advance(30_000);
    assert.equal(limiter.hit("a").ok, true);
    assert.equal(limiter.hit("b").ok, false);
  });
});
