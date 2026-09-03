import { describe, expect, it } from "vitest";
import { createCsrfToken, hasAllowedOrigin, hasValidCsrfToken } from "./csrf.js";

function requestFor(token?: string, header?: string, origin = "https://houses.example.edu") {
  return {
    cookies: token ? { school_csrf: token } : {},
    headers: { origin, ...(header === undefined ? {} : { "x-csrf-token": header }) }
  } as any;
}

describe("CSRF helpers", () => {
  it("creates opaque CSRF tokens", () => {
    const first = createCsrfToken();
    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(createCsrfToken()).not.toBe(first);
  });

  it("accepts only a matching cookie and request header", () => {
    const token = createCsrfToken();
    expect(hasValidCsrfToken(requestFor(token, token))).toBe(true);
    expect(hasValidCsrfToken(requestFor(token, "different"))).toBe(false);
    expect(hasValidCsrfToken(requestFor(token))).toBe(false);
  });

  it("accepts only the configured school web origin", () => {
    expect(hasAllowedOrigin(requestFor(undefined, undefined, "https://houses.example.edu"), "https://houses.example.edu")).toBe(true);
    expect(hasAllowedOrigin(requestFor(undefined, undefined, "https://attacker.example"), "https://houses.example.edu")).toBe(false);
  });
});
