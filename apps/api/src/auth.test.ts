import { describe, expect, it } from "vitest";

Object.assign(process.env, {
  NODE_ENV: "test",
  DATABASE_URL: "postgres://test:test@localhost:5432/test",
  REDIS_URL: "redis://localhost:6379",
  WEB_ORIGIN: "http://localhost:3000",
  JWT_ACCESS_SECRET: "x".repeat(48),
  BOOTSTRAP_TOKEN: "y".repeat(48),
  SCHOOL_SLUG: "test-school",
  COOKIE_SECURE: "false",
  TRUST_PROXY: "false"
});

const { createRefreshToken, hashToken, refreshExpiry, refreshLifetime } = await import("./auth.js");

describe("session token helpers", () => {
  it("creates opaque, unique refresh tokens and stores only a fixed-length hash", () => {
    const first = createRefreshToken();
    const second = createRefreshToken();
    expect(first).toMatch(/^[A-Za-z0-9_-]{64}$/);
    expect(second).not.toBe(first);
    expect(hashToken(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken(first)).toBe(hashToken(first));
  });

  it("uses the configured bounded refresh-session lifetime", () => {
    const remaining = refreshExpiry().getTime() - Date.now();
    expect(remaining).toBeGreaterThan(refreshLifetime * 1000 - 1_000);
    expect(remaining).toBeLessThanOrEqual(refreshLifetime * 1000);
  });
});
