// POST /api/csp-report — réception des violations de la CSP (Report-Only,
// voir next.config.ts). Public et sans état : une ligne compacte par
// violation dans les logs (console.warn), réponse 204. Ne lève jamais.
// Formats acceptés : `application/csp-report` (report-uri, un objet
// { "csp-report": {…} }), `application/reports+json` (Reporting API,
// tableau de { type: "csp-violation", body: {…} }) et `application/json`.
// Tout autre type : 204 sans rien lire ni loguer.

const MAX_BODY = 64 * 1024; // octets ; au-delà, lecture interrompue, rien logué
const MAX_REPORTS = 10; // violations loguées par requête
const MAX_FIELD = 200;
const ACCEPTED_TYPES = new Set(["application/csp-report", "application/reports+json", "application/json"]);

type Raw = Record<string, unknown>;

/** Chaîne courte ; URL sans requête ni fragment (données personnelles possibles). */
function field(value: unknown, isUrl = false): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  let s = String(value);
  if (isUrl) s = s.replace(/[?#].*$/, "");
  return s.length > MAX_FIELD ? `${s.slice(0, MAX_FIELD)}…` : s;
}

function compact(r: Raw) {
  return {
    doc: field(r.documentURL ?? r["document-uri"], true),
    directive: field(r.effectiveDirective ?? r["effective-directive"] ?? r["violated-directive"]),
    blocked: field(r.blockedURL ?? r["blocked-uri"], true),
    source: field(r.sourceFile ?? r["source-file"], true),
    line: field(r.lineNumber ?? r["line-number"]),
    sample: field(r.sample ?? r["script-sample"]),
  };
}

function extractReports(payload: unknown): Raw[] {
  const isObj = (v: unknown): v is Raw => !!v && typeof v === "object" && !Array.isArray(v);
  if (Array.isArray(payload)) {
    return payload
      .filter((r): r is Raw => isObj(r) && r.type === "csp-violation" && isObj(r.body))
      .map((r) => r.body as Raw);
  }
  if (isObj(payload) && isObj(payload["csp-report"])) return [payload["csp-report"]];
  return [];
}

/**
 * Corps lu en flux, plafonné à MAX_BODY octets quel que soit le Content-Length
 * (absent ou mensonger) : null au-delà.
 */
async function readBounded(request: Request): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) {
      await reader.cancel().catch(() => {});
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

const noContent = () => new Response(null, { status: 204 });

export async function POST(request: Request) {
  try {
    const type = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!ACCEPTED_TYPES.has(type)) return noContent();
    // Content-Length annoncé trop grand : pas la peine de lire.
    if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) return noContent();
    const text = await readBounded(request);
    if (text === null) return noContent();
    for (const r of extractReports(JSON.parse(text)).slice(0, MAX_REPORTS)) {
      console.warn(`[csp-report] ${JSON.stringify(compact(r))}`);
    }
  } catch {
    // Rapport mal formé ou flux interrompu : ignoré
  }
  return noContent();
}
