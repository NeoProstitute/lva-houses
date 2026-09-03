import { access, readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { closeDatabase, sql } from "./db.js";

const here = dirname(fileURLToPath(import.meta.url));
const migrationDirectories = [join(here, "migrations"), join(here, "../src/migrations")];

async function locateMigrationsDirectory() {
  for (const directory of migrationDirectories) {
    try {
      await access(directory);
      return directory;
    } catch { /* Try the next location. */ }
  }
  throw new Error("Migration files could not be found");
}

async function migrate() {
  const migrationsDirectory = await locateMigrationsDirectory();
  await sql`CREATE TABLE IF NOT EXISTS schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
  const files = (await readdir(migrationsDirectory)).filter((name) => name.endsWith(".sql")).sort();
  for (const file of files) {
    const [done] = await sql<{ name: string }[]>`SELECT name FROM schema_migrations WHERE name = ${file}`;
    if (done) continue;
    const statement = await readFile(join(migrationsDirectory, file), "utf8");
    await sql.begin(async (transaction) => {
      await transaction.unsafe(statement);
      await transaction`INSERT INTO schema_migrations (name) VALUES (${file})`;
    });
    console.info(`Applied ${file}`);
  }
}

migrate().then(closeDatabase).catch(async (error) => {
  console.error(error);
  await closeDatabase();
  process.exit(1);
});
