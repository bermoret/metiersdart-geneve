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
    status: annonceStatusEnum("status").default("pending"),
    publishedAt: timestamp("published_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("annonces_status_idx").on(table.status)],
);
