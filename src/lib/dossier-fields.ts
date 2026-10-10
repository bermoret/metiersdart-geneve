// Formulaire d'éligibilité des artisans (LOT A1) : spécification des champs,
// partagée entre l'écran admin (ordre, libellés et aides reproduits du
// formulaire papier « Check-list intégration nouvel artisan » du 04.05.26) et
// les routes API (liste blanche, typage et bornes des champs acceptés en
// PATCH). Fichier pur : aucun import serveur, testé dans dossier-fields.test.ts.
//
// Clés = colonnes camelCase de `artisanDossiers` (src/db/schema.ts).

export type FieldKind =
  | "text"
  | "textarea"
  | "bool" // oui / non / non renseigné (null)
  | "int"
  | "date" // "YYYY-MM-DD"
  | "select"
  | "category" // uuid de `categories`
  | "commune" // nom de la table `communes` (résolu côté serveur)
  | "links"; // { réseau: URL }

export type FieldOption = { value: string; label: string };

export type FieldSpec = {
  key: string;
  label: string;
  kind: FieldKind;
  /** Longueur maximale (text / textarea) ou valeur maximale (int). */
  max?: number;
  options?: readonly FieldOption[];
  help?: string;
  /** Clé d'un champ booléen : ce champ n'est affiché que s'il vaut true. */
  showIf?: string;
  /** Demi-largeur dans la grille. */
  half?: boolean;
};

export type DossierSection = {
  id: string;
  title: string;
  description?: string;
  fields: readonly FieldSpec[];
};

export const POINCON_OPTIONS: readonly FieldOption[] = [
  { value: "ATELIER", label: "Atelier" },
  { value: "ENTREPRISE", label: "Entreprise" },
  { value: "BOUTIQUE", label: "Boutique" },
];

export const DOSSIER_SECTIONS: readonly DossierSection[] = [
  {
    id: "identite",
    title: "Identité et coordonnées",
    fields: [
      { key: "source", label: "Source", kind: "text", help: "Comment MAG a connu l'artisan·e (recommandation, salon, demande spontanée…)." },
      { key: "firstName", label: "Prénom", kind: "text", half: true },
      { key: "lastName", label: "Nom", kind: "text", half: true },
      { key: "workshopName", label: "Nom de l'atelier", kind: "text", max: 500 },
      { key: "categoryId", label: "Domaine", kind: "category", half: true },
      { key: "craft", label: "Métier d'art", kind: "text", half: true },
      { key: "phone", label: "Téléphone", kind: "text", max: 100, half: true },
      { key: "email", label: "E-mail", kind: "text", half: true },
      { key: "street", label: "Adresse professionnelle", kind: "text", max: 500 },
      { key: "postalCode", label: "NPA", kind: "text", max: 20, half: true },
      { key: "city", label: "Ville", kind: "text", half: true },
      { key: "commune", label: "Commune", kind: "commune" },
    ],
  },
  {
    id: "repertoire",
    title: "Répertoire",
    fields: [
      { key: "inmaRecognized", label: "L'artisan·e exerce-t-il·elle un métier d'art reconnu par l'INMA ?", kind: "bool" },
      { key: "asmaMember", label: "L'artisan·e fait-il·elle partie de l'ASMA ?", kind: "bool", help: "Si non, envoyer le dossier à l'ASMA après intégration." },
      { key: "contactPublicConsent", label: "L'artisan·e accepte que son numéro de téléphone et son mail soient visibles sur sa page artisan MAG", kind: "bool", help: "Sans ce consentement, téléphone et mail restent dans ce dossier et ne sont pas copiés sur la fiche publique." },
    ],
  },
  {
    id: "criteres",
    title: "Critères d'intégration MAG",
    fields: [
      { key: "activityInGeneva", label: "L'activité est-elle exercée à Genève ?", kind: "bool" },
      { key: "mainlyManual", label: "L'activité exercée est-elle essentiellement artisanale / manuelle et non industrielle ?", kind: "bool" },
      { key: "mainIncome", label: "Professionnel·le : l'activité exercée est-elle la source de revenu principale ?", kind: "bool" },
      { key: "selfTaught", label: "Est-il·elle autodidacte ?", kind: "bool", help: "Si oui, demander un CV ou des références (à joindre aux pièces)." },
      { key: "companyDedicatedSector", label: "Entreprise : a-t-elle un secteur dédié aux métiers d'art ?", kind: "bool", help: "Laisser non renseigné (NA) si ce n'est pas une entreprise." },
      { key: "companyName", label: "Nom de l'entreprise", kind: "text", half: true },
      { key: "legalForm", label: "Forme juridique", kind: "text", max: 100, half: true },
      { key: "rcRegistered", label: "Inscription au registre du commerce", kind: "bool" },
      { key: "rcRegisteredAt", label: "Date de l'inscription", kind: "date", showIf: "rcRegistered", half: true },
      { key: "avsAffiliated", label: "Est-il·elle affilié·e à une caisse AVS ?", kind: "bool", help: "Laisser non renseigné (NA) si sans objet. Joindre l'attestation aux pièces." },
      { key: "avsFund", label: "Laquelle ?", kind: "text", showIf: "avsAffiliated", half: true },
      { key: "recognizedInField", label: "Est-il·elle reconnu·e au sein de son domaine d'activité ?", kind: "bool" },
      { key: "hasWebsite", label: "A-t-il·elle un site internet ?", kind: "bool" },
      { key: "website", label: "Site internet", kind: "text", max: 500, showIf: "hasWebsite" },
      { key: "hasSocialMedia", label: "A-t-il·elle des réseaux sociaux ?", kind: "bool" },
      { key: "socialLinks", label: "Réseaux sociaux", kind: "links", showIf: "hasSocialMedia", help: "Un lien par ligne, sous la forme « instagram: https://… »." },
    ],
  },
  {
    id: "eligibilite",
    title: "Éligibilité",
    description: "Le passage « Éligible » se fait avec le bouton en haut du dossier : il crée la fiche publique (non publiée) et l'inscrit au journal.",
    fields: [
      { key: "workshopVisitAt", label: "Rendez-vous dans l'atelier de l'artisan·e", kind: "date", half: true },
      { key: "visitedBy", label: "Visité par", kind: "text", half: true },
    ],
  },
  {
    id: "formations",
    title: "Formations",
    fields: [
      { key: "hasTraining", label: "Formation(s)", kind: "bool" },
      { key: "trainingDetails", label: "Parcours de formation", kind: "textarea", showIf: "hasTraining" },
      { key: "awardWinner", label: "Lauréat·e d'un prix (artisanat)", kind: "bool" },
      { key: "awardDetails", label: "Si oui, lequel ?", kind: "textarea", showIf: "awardWinner" },
      { key: "trainerCompany", label: "Autorisation entreprise formatrice", kind: "bool" },
      { key: "trainerCompanyNote", label: "Suivi OFPC", kind: "textarea", showIf: "trainerCompany", help: "Ex. « à faire valider par l'OFPC », « confirmation de l'OFPC reçue le … »." },
    ],
  },
  {
    id: "projets",
    title: "Divers projets",
    fields: [
      { key: "classVisits", label: "Visite de classes", kind: "bool" },
      { key: "classVisitsMin", label: "Min. (élèves)", kind: "int", showIf: "classVisits", half: true },
      { key: "classVisitsMax", label: "Max. (élèves)", kind: "int", showIf: "classVisits", half: true },
      { key: "publicVisits", label: "Visite grand public", kind: "bool" },
      { key: "publicVisitsMin", label: "Min. (personnes)", kind: "int", showIf: "publicVisits", half: true },
      { key: "publicVisitsMax", label: "Max. (personnes)", kind: "int", showIf: "publicVisits", half: true },
      { key: "talkConference", label: "Présentation du métier : conférence", kind: "bool" },
      { key: "talkRoundTable", label: "Présentation du métier : table ronde", kind: "bool" },
      { key: "talkClass", label: "Présentation du métier : classe", kind: "bool" },
      { key: "jemaInterest", label: "JEMA", kind: "bool", help: "Intérêt pour participer. La mention « a participé aux JEMA » de la fiche publique se règle dans la fiche." },
      { key: "ecolesArtisansInterest", label: "Écoles & Artisans", kind: "bool" },
    ],
  },
  {
    id: "fin",
    title: "Poinçon, associations, newsletter",
    description: "Demander une photo de haute qualité au format carré représentant le métier, et un texte de présentation de l'atelier et du métier d'art (env. 500 signes). Sinon, MAG rédige le texte et le soumet à validation. Photo et texte se saisissent dans la fiche publique.",
    fields: [
      { key: "poinconType", label: "Poinçon", kind: "select", options: POINCON_OPTIONS, half: true },
      { key: "professionalAssociation", label: "L'artisan·e fait-il·elle partie d'une association professionnelle ?", kind: "bool" },
      { key: "professionalAssociations", label: "Laquelle / lesquelles ?", kind: "textarea", showIf: "professionalAssociation" },
      { key: "newsletterConsent", label: "Consentement newsletter Mailchimp", kind: "bool" },
      { key: "notes", label: "Divers", kind: "textarea", max: 20000, help: "Informations libres. Les données personnelles notées ici relèvent des conditions générales de MAG et ne sont jamais publiées." },
    ],
  },
  {
    id: "suivi",
    title: "Suivi",
    fields: [
      { key: "integratedAt", label: "Date d'intégration", kind: "date", half: true, help: "Renseignée automatiquement à l'activation si vide (reprise de l'Excel pour l'historique)." },
    ],
  },
];

/** Index clé → spécification. */
export const DOSSIER_FIELDS: ReadonlyMap<string, FieldSpec> = new Map(
  DOSSIER_SECTIONS.flatMap((s) => s.fields).map((f) => [f.key, f]),
);

export const DOSSIER_STATUSES = [
  { value: "en_evaluation", label: "En évaluation", color: "bg-amber-100 text-amber-800" },
  { value: "eligible", label: "Éligible", color: "bg-sky-100 text-sky-800" },
  { value: "actif", label: "Actif", color: "bg-green-100 text-green-800" },
  { value: "desactive", label: "Désactivé", color: "bg-gray-200 text-gray-700" },
] as const;

export type DossierStatus = (typeof DOSSIER_STATUSES)[number]["value"];

export const DEACTIVATION_REASONS: readonly FieldOption[] = [
  { value: "faillite", label: "Faillite" },
  { value: "fermeture_atelier", label: "Fermeture d'atelier" },
  { value: "retraite", label: "Retraite" },
  { value: "depart", label: "Départ" },
  { value: "retrait_catalogue", label: "Retrait du catalogue" },
  { value: "autre", label: "Autre" },
];

export const JOURNAL_TYPES = [
  { value: "remarque", label: "Remarque", manual: true },
  { value: "changement_adresse", label: "Changement d'adresse", manual: true },
  { value: "fermeture", label: "Fermeture d'atelier", manual: true },
  { value: "activation", label: "Activation", manual: false },
  { value: "desactivation", label: "Désactivation", manual: false },
  { value: "eligibilite", label: "Éligibilité", manual: false },
] as const;

export type JournalType = (typeof JOURNAL_TYPES)[number]["value"];

/** Types qu'un admin peut ajouter à la main (les autres viennent des actions). */
export const MANUAL_JOURNAL_TYPES: readonly JournalType[] = JOURNAL_TYPES.filter((t) => t.manual).map((t) => t.value);

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "YYYY-MM-DD" existant (pas de 31 février), entre 1900 et 2100. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (y < 1900 || y > 2100) return false;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

const TEXT_MAX = 255;
const TEXTAREA_MAX = 5000;
const INT_MAX = 100_000;
const EXTRA_MAX_KEYS = 50;
const EXTRA_MAX_JSON = 20_000;
const LINKS_MAX = 10;

type Patch = Record<string, string | number | boolean | null | Record<string, string> | Record<string, string | number | boolean | null>>;

export type SanitizeResult = { ok: true; patch: Patch } | { ok: false; error: string };

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

type Checked<T> = { value: T } | { error: string };

function sanitizeText(key: string, v: unknown, max: number): Checked<string | null> {
  if (v === null || v === undefined) return { value: null };
  if (typeof v !== "string") return { error: `${key} : texte attendu` };
  const t = v.trim();
  if (!t) return { value: null };
  if (t.length > max) return { error: `${key} : ${max} caractères maximum` };
  return { value: t };
}

function sanitizeLinks(key: string, v: unknown): Checked<Record<string, string> | null> {
  if (v === null || v === undefined) return { value: null };
  if (!isPlainObject(v)) return { error: `${key} : objet { réseau: URL } attendu` };
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v)) {
    const name = k.trim().toLowerCase();
    if (!name || name.length > 40 || !/^[a-z0-9 _.-]+$/.test(name)) return { error: `${key} : nom de réseau invalide « ${k} »` };
    if (typeof val !== "string") return { error: `${key} : URL attendue pour « ${k} »` };
    const url = val.trim();
    if (!url) continue;
    if (url.length > 500 || !/^https?:\/\/\S+$/i.test(url)) return { error: `${key} : « ${k} » doit être une URL http(s)` };
    out[name] = url;
  }
  if (Object.keys(out).length > LINKS_MAX) return { error: `${key} : ${LINKS_MAX} liens maximum` };
  return { value: Object.keys(out).length ? out : null };
}

function sanitizeExtra(v: unknown): Checked<Record<string, string | number | boolean | null> | null> {
  if (v === null || v === undefined) return { value: null };
  if (!isPlainObject(v)) return { error: "extra : objet attendu" };
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, val] of Object.entries(v)) {
    const name = k.trim();
    if (!name || name.length > 64) return { error: `extra : clé invalide « ${k.slice(0, 20)} »` };
    if (val === null || typeof val === "boolean") out[name] = val;
    else if (typeof val === "number") {
      if (!Number.isFinite(val)) return { error: `extra : nombre invalide pour « ${name} »` };
      out[name] = val;
    } else if (typeof val === "string") {
      if (val.length > 2000) return { error: `extra : « ${name} » dépasse 2000 caractères` };
      out[name] = val;
    } else return { error: `extra : valeur non admise pour « ${name} »` };
  }
  if (Object.keys(out).length > EXTRA_MAX_KEYS) return { error: `extra : ${EXTRA_MAX_KEYS} clés maximum` };
  if (JSON.stringify(out).length > EXTRA_MAX_JSON) return { error: "extra : contenu trop volumineux" };
  return { value: Object.keys(out).length ? out : null };
}

/**
 * Corps d'un PATCH /api/admin/dossiers/[id] → valeurs à enregistrer.
 * Strict : toute clé hors du formulaire (statut, dates de sortie, artisan_id…)
 * est refusée, ces champs ne changent que par les actions.
 */
export function sanitizeDossierPatch(body: unknown): SanitizeResult {
  if (!isPlainObject(body)) return { ok: false, error: "Corps JSON attendu" };
  const patch: Patch = {};
  for (const [key, raw] of Object.entries(body)) {
    if (key === "extra") {
      const r = sanitizeExtra(raw);
      if ("error" in r) return { ok: false, error: r.error };
      patch.extra = r.value;
      continue;
    }
    const spec = DOSSIER_FIELDS.get(key);
    if (!spec) return { ok: false, error: `Champ inconnu : ${key.slice(0, 40)}` };
    switch (spec.kind) {
      case "text":
      case "textarea":
      case "commune": {
        const r = sanitizeText(key, raw, spec.max ?? (spec.kind === "textarea" ? TEXTAREA_MAX : TEXT_MAX));
        if ("error" in r) return { ok: false, error: r.error };
        patch[key] = r.value;
        break;
      }
      case "bool":
        if (raw === null || raw === undefined || raw === "") patch[key] = null;
        else if (typeof raw === "boolean") patch[key] = raw;
        else return { ok: false, error: `${key} : oui / non attendu` };
        break;
      case "int":
        if (raw === null || raw === undefined || raw === "") patch[key] = null;
        else {
          const n = typeof raw === "string" && /^\d+$/.test(raw.trim()) ? Number(raw) : raw;
          if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > (spec.max ?? INT_MAX)) {
            return { ok: false, error: `${key} : nombre entier entre 0 et ${spec.max ?? INT_MAX} attendu` };
          }
          patch[key] = n;
        }
        break;
      case "date":
        if (raw === null || raw === undefined || raw === "") patch[key] = null;
        else if (isIsoDate(raw)) patch[key] = raw;
        else return { ok: false, error: `${key} : date AAAA-MM-JJ attendue` };
        break;
      case "select":
        if (raw === null || raw === undefined || raw === "") patch[key] = null;
        else if (typeof raw === "string" && spec.options?.some((o) => o.value === raw)) patch[key] = raw;
        else return { ok: false, error: `${key} : valeur hors liste` };
        break;
      case "category":
        if (raw === null || raw === undefined || raw === "") patch[key] = null;
        else if (isUuid(raw)) patch[key] = raw;
        else return { ok: false, error: `${key} : identifiant de domaine invalide` };
        break;
      case "links": {
        const r = sanitizeLinks(key, raw);
        if ("error" in r) return { ok: false, error: r.error };
        patch[key] = r.value;
        break;
      }
    }
  }
  return { ok: true, patch };
}
