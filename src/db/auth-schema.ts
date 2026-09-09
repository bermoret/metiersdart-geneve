import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified"),
  image: varchar("image", { length: 500 }),
  role: varchar("role", { length: 50 }).default("user").notNull(), // "user" | "admin"
});

export const accounts = pgTable(
  "account",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    primaryKey({
      columns: [table.provider, table.providerAccountId],
      name: "account_provider_providerAccountId_unique",
    }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: varchar("session_token", { length: 255 }).notNull().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.identifier, table.token],
      name: "verification_token_identifier_token_unique",
    }),
  ],
);

// DrizzleAdapter expects these exact column names for passkey support
export const authenticators = pgTable("authenticator", {
  credentialID: varchar("credential_id", { length: 255 }).notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  credentialPublicKey: text("credential_public_key").notNull(),
  counter: integer("counter").notNull().default(0),
  credentialDeviceType: varchar("credential_device_type", { length: 255 }).notNull(),
  credentialBackedUp: boolean("credential_backed_up").notNull().default(false),
  transports: text("transports"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
