import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Initialisation directe — pg/Pool ne crash pas au build même avec
// une connectionString vide ; il ne se connecte qu'au premier query.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "",
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;
