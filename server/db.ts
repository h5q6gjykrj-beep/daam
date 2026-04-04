import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Strip sslmode from the connection string — pg deprecated passing SSL mode
// as a query param. Pass ssl as a proper config object instead.
const connectionString = process.env.DATABASE_URL.replace(/[?&]sslmode=[^&]*/g, (m) =>
  m.startsWith('?') ? '?' : ''
).replace(/\?$/, '');

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
export const db = drizzle(pool, { schema });
