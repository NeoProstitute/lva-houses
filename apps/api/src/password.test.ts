import { describe, expect, it } from "vitest";
import { passwordInput } from "./password.js";

describe("password policy", () => {
  it("accepts a sufficiently long mixed-character password", () => {
    expect(passwordInput.safeParse("R8!mV2#qL7@wT4$k").success).toBe(true);
  });

  it("rejects short or single-character-class passwords", () => {
    expect(passwordInput.safeParse("Admin123456!").success).toBe(false);
    expect(passwordInput.safeParse("alllowercasepassword!").success).toBe(false);
    expect(passwordInput.safeParse("ALLUPPERCASEPASSWORD!").success).toBe(false);
    expect(passwordInput.safeParse("1234567890123456!").success).toBe(false);
  });
});
