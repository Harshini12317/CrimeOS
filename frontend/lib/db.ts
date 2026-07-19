// lib/db.ts
//
// Neon Postgres connection for use inside Server Components / Server Actions.
// Requires: npm install @neondatabase/serverless
// Env var:  DATABASE_URL=postgresql://...  (from your Neon project settings)

import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to your .env.local / environment.");
}

// `sql` is a tagged-template query function — safe against SQL injection
// as long as you always interpolate values via the template literal, e.g.
//   sql`select * from legal_sections where act = ${act}`
export const sql = neon(process.env.DATABASE_URL);