import { randomBytes, timingSafeEqual } from "node:crypto";
import type { FastifyRequest } from "fastify";

export const csrfCookie = "school_csrf";

export function createCsrfToken() {
  return randomBytes(32).toString("base64url");
}

/**
 * The browser can read the CSRF cookie but other sites cannot: they neither
 * receive it nor can they add this non-simple header through CORS. Comparing
 * it in constant time also keeps this check safe to reuse outside Fastify.
 */
export function hasValidCsrfToken(request: FastifyRequest) {
  const cookieToken = request.cookies[csrfCookie];
  const headerToken = request.headers["x-csrf-token"];
  if (!cookieToken || typeof headerToken !== "string") return false;
  const cookie = Buffer.from(cookieToken);
  const header = Buffer.from(headerToken);
  return cookie.length === header.length && timingSafeEqual(cookie, header);
}

export function hasAllowedOrigin(request: FastifyRequest, webOrigin: string) {
  return request.headers.origin === webOrigin;
}
