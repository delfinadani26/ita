import { defineConfig } from "drizzle-kit";

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

if (!dbUrl) {
  throw new Error("DATABASE_URL or SUPABASE_DATABASE_URL is not set");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
  introspect: {
    casing: "camel",
  },
});
