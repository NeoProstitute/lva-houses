import { describe, expect, it } from "vitest";
import { canRemoveActiveAdmin, removesActiveAdmin } from "./admin-protection.js";

describe("active administrator protection", () => {
  const soleAdmin = {
    existingRole: "admin" as const,
    existingActive: true,
    requestedRole: "admin" as const,
    requestedActive: false
  };

  it("does not allow the sole active administrator to be deactivated", () => {
    expect(removesActiveAdmin(soleAdmin)).toBe(true);
    expect(canRemoveActiveAdmin(1, soleAdmin)).toBe(false);
  });

  it("does not allow the sole active administrator to be demoted", () => {
    const demotion = { ...soleAdmin, requestedRole: "teacher" as const, requestedActive: true };
    expect(canRemoveActiveAdmin(1, demotion)).toBe(false);
  });

  it("allows a change when another active administrator remains", () => {
    expect(canRemoveActiveAdmin(2, soleAdmin)).toBe(true);
  });

  it("does not block harmless updates to an administrator", () => {
    expect(canRemoveActiveAdmin(1, { ...soleAdmin, requestedActive: true })).toBe(true);
  });
});
