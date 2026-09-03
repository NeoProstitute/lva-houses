import postgres from "postgres";
import { env } from "./env.js";

export const sql = postgres(env.DATABASE_URL, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
  onnotice: () => undefined
});

export async function closeDatabase() {
  await sql.end({ timeout: 5 });
}
