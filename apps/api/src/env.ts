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
  TRUST_PROXY: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  EMAIL_PROVIDER: z.enum(["disabled", "resend"]).default("disabled"),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(3).max(254).optional(),
  PASSWORD_RESET_URL: z.string().url().optional()
}).superRefine((value, context) => {
  if (value.EMAIL_PROVIDER === "resend" && !value.RESEND_API_KEY) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "RESEND_API_KEY is required when email is enabled" });
  }
  if (value.EMAIL_PROVIDER === "resend" && !value.EMAIL_FROM) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "EMAIL_FROM is required when email is enabled" });
  }
});

export const env = environment.parse(process.env);
