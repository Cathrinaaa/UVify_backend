import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema.js"; // <-- go up one folder, into shared
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // required for Neon
  },
});

export const db = drizzle(pool, { schema });
