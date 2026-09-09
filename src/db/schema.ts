import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
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

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  color: varchar("color", { length: 20 }),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
    latitude: integer("latitude"), // microdegrés (*1e6)
    longitude: integer("longitude"), // microdegrés (*1e6)
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

export const actualites = pgTable("actualites", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  excerpt: text("excerpt"),
  content: text("content"),
  category: varchar("category", { length: 100 }),
  eventDate: timestamp("event_date"),
  eventEndDate: timestamp("event_end_date"),
  linkUrl: varchar("link_url", { length: 500 }),
  imageUrl: varchar("image_url", { length: 500 }),
  isArchived: boolean("is_archived").default(false),
  published: boolean("published").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Médias (capsules vidéo, presse) ────────────────────────────

export const medias = pgTable("medias", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // "video" | "presse" | "article"
  mediaType: varchar("media_type", { length: 50 }),
  categoryId: uuid("category_id").references(() => categories.id),
  videoUrl: varchar("video_url", { length: 500 }),
  externalUrl: varchar("external_url", { length: 500 }),
  pdfUrl: varchar("pdf_url", { length: 500 }),
  date: timestamp("date"),
  source: varchar("source", { length: 255 }),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
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
