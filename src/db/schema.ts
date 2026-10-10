import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  check,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  doublePrecision,
  date,
  index,
} from "drizzle-orm/pg-core";

// ─── Enums ──────────────────────────────────────────────────────

export const artisanTypeEnum = pgEnum("artisan_type", [
  "artisan",
  "atelier",
  "entreprise",
  "institution_culturelle",
  "ecole_formatrice",
  "association_professionnelle",
  "partenaire",
]);

// ─── Categories (domaines d'art) ────────────────────────────────

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    icon: varchar("icon", { length: 100 }),
    color: varchar("color", { length: 20 }),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  // La couleur finit dans du HTML (marqueurs Leaflet) : même règle que isHexColor().
  // db:push compare les CHECK par nom : changer la regex ici ne la change pas en base
  // (DROP + ADD en SQL, ou renommer la contrainte).
  (t) => [check("categories_color_hex", sql`${t.color} ~ '^#[0-9a-fA-F]{6}$'`)],
);

// ─── Artisans ──────────────────────────────────────────────────

export const artisans = pgTable(
  "artisans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 500 }).notNull().unique(),
    type: artisanTypeEnum("type").default("artisan"),
    craft: text("craft"),
    categoryId: uuid("category_id").references(() => categories.id),
    commune: varchar("commune", { length: 255 }),
    address: varchar("address", { length: 500 }),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    phone: varchar("phone", { length: 100 }),
    email: varchar("email", { length: 255 }),
    website: varchar("website", { length: 500 }),
    shortDescription: text("short_description"),
    longDescription: text("long_description"),
    imageUrl: varchar("image_url", { length: 500 }), // Vercel Blob
    galleryImages: jsonb("gallery_images").$type<string[]>(),
    socialLinks: jsonb("social_links").$type<Record<string, string>>(),
    jemaParticipant: boolean("jema_participant").default(false),
    published: boolean("published").default(true),
    // Champs enrichis issus du scraping (fiches détaillées)
    video: varchar("video", { length: 500 }),
    autre: text("autre"),
    poinconType: varchar("poincon_type", { length: 50 }), // "ATELIER" | "BOUTIQUE" | "ENTREPRISE" | "INSTITUTION"
    poinconModalText: text("poincon_modal_text"),
    poinconModalLink: varchar("poincon_modal_link", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("artisans_category_idx").on(table.categoryId),
    index("artisans_commune_idx").on(table.commune),
    index("artisans_type_idx").on(table.type),
  ],
);

// ─── JEMA Éditions ──────────────────────────────────────────────

export const jemaEditions = pgTable("jema_editions", {
  id: uuid("id").defaultRandom().primaryKey(),
  year: integer("year").notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isUpcoming: boolean("is_upcoming").default(false),
  isPast: boolean("is_past").default(false),
  description: text("description"),
  highlight: varchar("highlight", { length: 255 }),
  programUrl: varchar("program_url", { length: 500 }),
  galleryImages: jsonb("gallery_images").$type<string[]>(),
  stats: jsonb("stats").$type<Record<string, number>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── JEMA Parcours (par édition) ────────────────────────────────

export const jemaParcours = pgTable("jema_parcours", {
  id: uuid("id").defaultRandom().primaryKey(),
  editionId: uuid("edition_id")
    .references(() => jemaEditions.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
});

// ─── Métiers & Formations ───────────────────────────────────────

export const metiersFormations = pgTable("metiers_formations", {
  id: uuid("id").defaultRandom().primaryKey(),
  metierName: varchar("metier_name", { length: 255 }).notNull(),
  definitionInma: text("definition_inma"),
  formations: text("formations"),
  formationUrls: jsonb("formation_urls").$type<Record<string, string>>(),
  categoryId: uuid("category_id").references(() => categories.id),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Actualités ─────────────────────────────────────────────────

// Cartes de /l-actu (voir src/lib/actu-medias.ts pour le rendu) :
// `category` = étiquette rouge au-dessus du titre (« En ce moment »), `source` =
// « par … », `excerpt` = texte de la carte, la date affichée est dérivée de
// event_date / event_end_date, `time_label` = horaire libre (« 19h-20h30 »).
// Colonnes source, subtitle, time_label, link_label : scripts/migrate-actu-medias.ts.

export const actualites = pgTable("actualites", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  excerpt: text("excerpt"),
  content: text("content"), // non affiché sur le site (réservé)
  category: varchar("category", { length: 100 }), // étiquette (« En ce moment »)
  source: varchar("source", { length: 255 }), // « par Métiers d'Art Genève »
  subtitle: varchar("subtitle", { length: 255 }), // sous le titre (« Métiers du bois — Charpentier·ère »)
  eventDate: timestamp("event_date"),
  eventEndDate: timestamp("event_end_date"),
  timeLabel: varchar("time_label", { length: 100 }), // horaire libre (« 19h-20h30 »)
  linkUrl: varchar("link_url", { length: 500 }), // http(s), mailto: ou chemin du site (« /jema »)
  linkLabel: varchar("link_label", { length: 100 }), // « Plus d'info » par défaut, « Contact » pour un mailto
  imageUrl: varchar("image_url", { length: 500 }),
  isArchived: boolean("is_archived").default(false),
  published: boolean("published").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Médias (capsules vidéo, presse) ────────────────────────────
// `type` place le média dans une section de /medias (voir MEDIA_TYPES dans
// src/lib/actu-medias.ts) : video (capsule), interview (vidéo « On parle des
// métiers d'art »), article (lien de la même section), presse (revue de presse
// JEMA en PDF), archive (article archivé, daté). `media_type` (vimeo / youtube)
// est déduit de video_url à l'enregistrement. Colonne published :
// scripts/migrate-actu-medias.ts.

export const medias = pgTable("medias", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // "video" | "interview" | "article" | "presse" | "archive"
  mediaType: varchar("media_type", { length: 50 }), // "vimeo" | "youtube", déduit de video_url
  categoryId: uuid("category_id").references(() => categories.id), // non utilisé par le site
  videoUrl: varchar("video_url", { length: 500 }),
  externalUrl: varchar("external_url", { length: 500 }),
  pdfUrl: varchar("pdf_url", { length: 500 }),
  date: timestamp("date"),
  source: varchar("source", { length: 255 }), // sous-titre : domaine d'une capsule, média d'un article
  description: text("description"), // non affiché sur le site (réservé)
  sortOrder: integer("sort_order").default(0),
  published: boolean("published").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Manufacto (éditions scolaires) ─────────────────────────────

export const manufactoEditions = pgTable("manufacto_editions", {
  id: uuid("id").defaultRandom().primaryKey(),
  year: integer("year").notNull(),
  schools: jsonb("schools").$type<string[]>(),
  description: text("description"),
  mediaUrl: varchar("media_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Partenaires ────────────────────────────────────────────────

export const partenaires = pgTable("partenaires", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  abbreviation: varchar("abbreviation", { length: 50 }),
  description: text("description"),
  logoUrl: varchar("logo_url", { length: 500 }),
  website: varchar("website", { length: 500 }),
  socialLinks: jsonb("social_links").$type<Record<string, string>>(),
  sortOrder: integer("sort_order").default(0),
});

// ─── Comité (membres du comité MAG) ──────────────────────────────

export const comiteMembers = pgTable("comite_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }).notNull(),
  representation: varchar("representation", { length: 255 }),
  sortOrder: integer("sort_order").default(0),
});

// ─── Pages statiques (contenu éditable) ────────────────────────

export const staticPages = pgTable("static_pages", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  content: jsonb("content"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Communes du canton de Genève ──────────────────────────────
// Liste des 45 communes genevoises avec coordonnées géographiques.
// Le champ soutient_mag indique si la commune soutient financièrement
// ou institutionnellement MAG (affiché sur la carte dédiée).

export const communes = pgTable("communes", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  soutientMag: boolean("soutient_mag").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Paramètres du site (singleton) ───────────────────────────
// Table à une seule ligne (id = 'default') pour les valeurs
// saisies manuellement par MAG, non calculées depuis la base.
// Extensible : ajouter des colonnes au fur et à mesure des besoins.

export const siteSettings = pgTable("site_settings", {
  id: varchar("id", { length: 50 }).primaryKey(), // toujours "default"
  eventsCount: integer("events_count").default(0),
  craftsCount: integer("crafts_count"), // « Métiers » de MAG en chiffres (nomenclature MAG), saisi dans l'admin
  communautePassword: varchar("communaute_password", { length: 255 }), // mot de passe commun espace Communauté
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Annonces de l'Espace Communauté ───────────────────────────
// Petites annonces entre artisans, validées par MAG avant publication.
// File de modération : pending → published | rejected.

export const annonceStatusEnum = pgEnum("annonce_status", [
  "pending",
  "published",
  "rejected",
]);

export const annonces = pgTable(
  "annonces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    authorName: varchar("author_name", { length: 255 }).notNull(),
    authorEmail: varchar("author_email", { length: 255 }),
    content: text("content").notNull(),
    imageUrl: varchar("image_url", { length: 500 }), // photo facultative (Vercel Blob public, suffixe aléatoire)
    status: annonceStatusEnum("status").default("pending"),
    publishedAt: timestamp("published_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("annonces_status_idx").on(table.status)],
);

// ─── Dossiers artisans (LOT A1 : onboarding et suivi) ───────────
// Fiche INTERNE d'un artisan : formulaire d'éligibilité, pièces, journal.
// Table séparée de `artisans` (jamais sélectionnée par le code public,
// voir docs/plateforme-gestion.md § 2 et src/lib/dossiers-exposure.test.ts).
// Le dossier précède la fiche : artisan_id reste NULL jusqu'au passage
// « Éligible », qui crée la fiche publique non publiée.

export const dossierStatusEnum = pgEnum("dossier_status", [
  "en_evaluation",
  "eligible",
  "actif",
  "desactive",
]);

export const journalTypeEnum = pgEnum("journal_type", [
  "remarque",
  "changement_adresse",
  "fermeture",
  "activation",
  "desactivation",
  "eligibilite",
]);

export const artisanDossiers = pgTable(
  "artisan_dossiers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    artisanId: uuid("artisan_id")
      .references(() => artisans.id, { onDelete: "set null" })
      .unique(),
    status: dossierStatusEnum("status").notNull().default("en_evaluation"),
    // En-tête du formulaire
    source: text("source"),
    firstName: varchar("first_name", { length: 255 }),
    lastName: varchar("last_name", { length: 255 }),
    workshopName: varchar("workshop_name", { length: 500 }),
    categoryId: uuid("category_id").references(() => categories.id),
    craft: varchar("craft", { length: 255 }),
    phone: varchar("phone", { length: 100 }),
    email: varchar("email", { length: 255 }),
    street: varchar("street", { length: 500 }),
    postalCode: varchar("postal_code", { length: 20 }),
    city: varchar("city", { length: 255 }),
    commune: varchar("commune", { length: 255 }),
    // Répertoire
    inmaRecognized: boolean("inma_recognized"),
    asmaMember: boolean("asma_member"),
    contactPublicConsent: boolean("contact_public_consent"),
    // Critères d'intégration MAG
    activityInGeneva: boolean("activity_in_geneva"),
    mainlyManual: boolean("mainly_manual"),
    mainIncome: boolean("main_income"),
    selfTaught: boolean("self_taught"),
    companyDedicatedSector: boolean("company_dedicated_sector"),
    companyName: varchar("company_name", { length: 255 }),
    rcRegistered: boolean("rc_registered"),
    legalForm: varchar("legal_form", { length: 100 }),
    rcRegisteredAt: date("rc_registered_at", { mode: "string" }),
    avsAffiliated: boolean("avs_affiliated"),
    avsFund: varchar("avs_fund", { length: 255 }),
    recognizedInField: boolean("recognized_in_field"),
    hasWebsite: boolean("has_website"),
    website: varchar("website", { length: 500 }),
    hasSocialMedia: boolean("has_social_media"),
    socialLinks: jsonb("social_links").$type<Record<string, string>>(),
    // Éligibilité
    workshopVisitAt: date("workshop_visit_at", { mode: "string" }),
    visitedBy: varchar("visited_by", { length: 255 }),
    // Formations
    hasTraining: boolean("has_training"),
    trainingDetails: text("training_details"),
    awardWinner: boolean("award_winner"),
    awardDetails: text("award_details"),
    trainerCompany: boolean("trainer_company"),
    trainerCompanyNote: text("trainer_company_note"),
    // Divers projets
    classVisits: boolean("class_visits"),
    classVisitsMin: integer("class_visits_min"),
    classVisitsMax: integer("class_visits_max"),
    publicVisits: boolean("public_visits"),
    publicVisitsMin: integer("public_visits_min"),
    publicVisitsMax: integer("public_visits_max"),
    talkConference: boolean("talk_conference"),
    talkRoundTable: boolean("talk_round_table"),
    talkClass: boolean("talk_class"),
    jemaInterest: boolean("jema_interest"),
    ecolesArtisansInterest: boolean("ecoles_artisans_interest"),
    // Fin de formulaire
    poinconType: varchar("poincon_type", { length: 50 }),
    professionalAssociation: boolean("professional_association"),
    professionalAssociations: text("professional_associations"),
    newsletterConsent: boolean("newsletter_consent"),
    notes: text("notes"),
    extra: jsonb("extra").$type<Record<string, string | number | boolean | null>>(),
    // Suivi
    integratedAt: date("integrated_at", { mode: "string" }),
    deactivatedAt: date("deactivated_at", { mode: "string" }),
    deactivationReason: varchar("deactivation_reason", { length: 100 }),
    createdBy: varchar("created_by", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("artisan_dossiers_status_idx").on(table.status),
    index("artisan_dossiers_last_name_idx").on(table.lastName),
  ],
);

// Pièces justificatives : blobs PRIVÉS (jamais d'URL publique en base,
// seulement le chemin ; servies par la route admin de téléchargement).
export const artisanDocuments = pgTable(
  "artisan_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dossierId: uuid("dossier_id")
      .notNull()
      .references(() => artisanDossiers.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 255 }).notNull(),
    kind: varchar("kind", { length: 50 }).notNull().default("autre"),
    pathname: varchar("pathname", { length: 500 }).notNull().unique(),
    contentType: varchar("content_type", { length: 100 }).notNull(),
    size: integer("size").notNull(),
    uploadedBy: varchar("uploaded_by", { length: 255 }),
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  },
  (table) => [index("artisan_documents_dossier_idx").on(table.dossierId)],
);

// Journal de suivi, en ajout seul : remarques datées, changements
// d'adresse, fermetures, activations / désactivations, éligibilité.
export const artisanJournal = pgTable(
  "artisan_journal",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dossierId: uuid("dossier_id")
      .notNull()
      .references(() => artisanDossiers.id, { onDelete: "cascade" }),
    type: journalTypeEnum("type").notNull(),
    occurredAt: date("occurred_at", { mode: "string" }).notNull(),
    text: text("text"),
    motif: varchar("motif", { length: 100 }),
    author: varchar("author", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("artisan_journal_dossier_idx").on(table.dossierId, table.occurredAt)],
);
