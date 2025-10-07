import { defineConfig } from "drizzle-kit";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in .env file");
}

export default defineConfig({
  out: "./migrations",             // folder for migration files
  schema: "../shared/schema.js",    // adjust if yours is .ts
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // required for Neon
    },
  },
});
