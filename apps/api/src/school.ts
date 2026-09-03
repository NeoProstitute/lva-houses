import { sql } from "./db.js";
import { env } from "./env.js";

export async function configuredSchool() {
  const [school] = await sql<{ id: string; name: string; slug: string }[]>`
    SELECT id, name, slug FROM schools WHERE slug = ${env.SCHOOL_SLUG}
  `;
  return school ?? null;
}
