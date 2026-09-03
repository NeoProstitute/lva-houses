import { createHash, randomBytes } from "node:crypto";
import type { FastifyReply } from "fastify";
import { env } from "./env.js";
import type { AuthUser } from "./types.js";

export const accessCookie = "school_access";
export const refreshCookie = "school_refresh";
export const accessLifetime = 15 * 60;
export const refreshLifetime = 7 * 24 * 60 * 60;

export function createRefreshToken() {
  return randomBytes(48).toString("base64url");
}

export function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function refreshExpiry() {
  return new Date(Date.now() + refreshLifetime * 1000);
}

export function setSessionCookies(
  reply: FastifyReply,
  accessToken: string,
  refreshToken: string
) {
  const common = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax" as const,
    path: "/"
  };
  reply
    .setCookie(accessCookie, accessToken, { ...common, maxAge: accessLifetime })
    .setCookie(refreshCookie, refreshToken, { ...common, maxAge: refreshLifetime });
}

export function clearSessionCookies(reply: FastifyReply) {
  const common = { httpOnly: true, secure: env.COOKIE_SECURE, sameSite: "lax" as const, path: "/" };
  reply.clearCookie(accessCookie, common).clearCookie(refreshCookie, common);
}

export function publicUser(user: AuthUser) {
  return { id: user.id, name: user.name, role: user.role };
}
