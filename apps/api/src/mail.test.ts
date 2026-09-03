import { afterEach, describe, expect, it, vi } from "vitest";

Object.assign(process.env, {
  NODE_ENV: "test",
  DATABASE_URL: "postgres://test:test@localhost:5432/test",
  REDIS_URL: "redis://localhost:6379",
  WEB_ORIGIN: "https://houses.example.school",
  JWT_ACCESS_SECRET: "x".repeat(48),
  BOOTSTRAP_TOKEN: "y".repeat(48),
  SCHOOL_SLUG: "test-school",
  COOKIE_SECURE: "true",
  TRUST_PROXY: "true",
  EMAIL_PROVIDER: "resend",
  RESEND_API_KEY: "re_test_key",
  EMAIL_FROM: "Leonardo V Academy Houses <noreply@example.school>",
  PASSWORD_RESET_URL: "https://houses.example.school/reset-password"
});

const { sendPasswordResetEmail } = await import("./mail.js");

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("password recovery email", () => {
  it("sends a school-branded one-time link through the configured provider", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    const token = "a".repeat(43);

    await expect(sendPasswordResetEmail("learner@example.school", "Ava <Learner>", token)).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(options.method).toBe("POST");
    expect(options.headers).toMatchObject({ authorization: "Bearer re_test_key", "content-type": "application/json" });
    const body = JSON.parse(String(options.body));
    expect(body.from).toBe("Leonardo V Academy Houses <noreply@example.school>");
    expect(body.to).toEqual(["learner@example.school"]);
    expect(body.text).toContain(`https://houses.example.school/reset-password?token=${token}`);
    expect(body.html).toContain("Ava &lt;Learner&gt;");
  });

  it("fails closed when the mail provider rejects or cannot receive the request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
    await expect(sendPasswordResetEmail("learner@example.school", "Ava", "a".repeat(43))).resolves.toBe(false);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network unavailable")));
    await expect(sendPasswordResetEmail("learner@example.school", "Ava", "a".repeat(43))).resolves.toBe(false);
  });
});
