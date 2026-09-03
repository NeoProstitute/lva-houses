import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { Redis } from "ioredis";
import { closeDatabase, sql } from "./db.js";
import { env } from "./env.js";
import { accessCookie, refreshCookie } from "./auth.js";
import { hasAllowedOrigin, hasValidCsrfToken } from "./csrf.js";
import { administrationRoutes } from "./routes/admin.js";
import { authRoutes } from "./routes/auth.js";
import { awardRoutes } from "./routes/awards.js";
import { houseRoutes } from "./routes/houses.js";
import { mediaRoutes } from "./routes/media.js";
import "./types.js";

export async function createServer() {
  const app = Fastify({
    logger: { level: env.NODE_ENV === "production" ? "info" : "debug" },
    bodyLimit: 2_621_440,
    trustProxy: env.TRUST_PROXY,
    requestIdHeader: "x-request-id"
  });
  const redis = new Redis(env.REDIS_URL, { connectTimeout: 5_000, maxRetriesPerRequest: 2, enableOfflineQueue: false });

  app.addHook("onClose", async () => {
    await redis.quit();
    await closeDatabase();
  });
  await app.register(cookie);
  app.addHook("onRequest", async (request, reply) => {
    if (!new Set(["POST", "PUT", "PATCH", "DELETE"]).has(request.method)) return;

    // Every browser write must originate from the configured web application.
    // This also protects unauthenticated writes such as login from login-CSRF.
    if (!hasAllowedOrigin(request, env.WEB_ORIGIN)) {
      return reply.code(403).send({ error: "This request did not come from the school application" });
    }

    // If a session cookie is present, require a second, script-readable token.
    // A third-party site cannot read that token or attach this custom header.
    const hasSessionCookie = Boolean(request.cookies[accessCookie] || request.cookies[refreshCookie]);
    if (hasSessionCookie && !hasValidCsrfToken(request)) {
      return reply.code(403).send({ error: "Your security token is missing or expired. Refresh the page and try again." });
    }
  });
  await app.register(multipart, {
    limits: { files: 1, fields: 0, parts: 1, fileSize: 2 * 1024 * 1024 },
    throwFileSizeLimit: true
  });
  await app.register(cors, {
    origin: env.WEB_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
  });
  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "same-site" },
    referrerPolicy: { policy: "no-referrer" }
  });
  await app.register(jwt, { secret: env.JWT_ACCESS_SECRET, cookie: { cookieName: "school_access", signed: false }, sign: { expiresIn: "15m" } });
  await app.register(rateLimit, { redis, max: 240, timeWindow: "1 minute", ban: 2 });
  if (env.NODE_ENV !== "production") {
    await app.register(swagger, {
      openapi: { info: { title: "Leonardo V Academy Houses API", version: "0.1.0" }, servers: [{ url: "/" }] }
    });
    await app.register(swaggerUi, { routePrefix: "/docs", uiConfig: { docExpansion: "list", deepLinking: false } });
  }

  app.get("/health", async (_request, reply) => {
    const [database] = await sql<{ ok: number }[]>`SELECT 1 AS ok`;
    const cache = await redis.ping();
    return reply.send({ status: database?.ok === 1 && cache === "PONG" ? "ok" : "degraded" });
  });
  app.get("/ready", async (_request, reply) => reply.send({ status: "ready" }));

  await app.register(authRoutes);
  await app.register(houseRoutes);
  await app.register(mediaRoutes);
  await app.register(awardRoutes);
  await app.register(administrationRoutes);

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    if (reply.sent) return;
    const appError = typeof error === "object" && error !== null ? error as { statusCode?: unknown; message?: unknown } : {};
    const statusCode = typeof appError.statusCode === "number" && appError.statusCode < 500 ? appError.statusCode : 500;
    const message = typeof appError.message === "string" ? appError.message : "Request failed";
    reply.code(statusCode).send({ error: statusCode === 500 ? "Something went wrong" : message });
  });
  return app;
}

async function main() {
  const app = await createServer();
  await app.listen({ host: "0.0.0.0", port: env.API_PORT });
}

if (process.env.NODE_ENV !== "test") {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
