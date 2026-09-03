import { describe, expect, it } from "vitest";
import { inspectHouseImage } from "./media.js";

describe("house image inspection", () => {
  it("accepts recognised image signatures only", () => {
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(8)]);
    const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(9)]);
    const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBP")]);
    expect(inspectHouseImage(png)?.contentType).toBe("image/png");
    expect(inspectHouseImage(jpeg)?.contentType).toBe("image/jpeg");
    expect(inspectHouseImage(webp)?.contentType).toBe("image/webp");
  });

  it("rejects ambiguous, oversized and non-image data", () => {
    expect(inspectHouseImage(Buffer.from("<svg onload=alert(1) />"))).toBeNull();
    expect(inspectHouseImage(Buffer.alloc(2 * 1024 * 1024 + 1))).toBeNull();
  });
});
