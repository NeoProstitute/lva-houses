import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const here = dirname(fileURLToPath(import.meta.url));
config({ path: process.env.DOTENV_CONFIG_PATH ?? resolve(here, "../../../.env") });

const environment = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  WEB_ORIGIN: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(48),
  BOOTSTRAP_TOKEN: z.string().min(48),
  SCHOOL_SLUG: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{3,48}$/),
  COOKIE_SECURE: z.enum(["true", "false"]).default("true").transform((value) => value === "true"),
  TRUST_PROXY: z.enum(["true", "false"]).default("false").transform((value) => value === "true")
});

export const env = environment.parse(process.env);
