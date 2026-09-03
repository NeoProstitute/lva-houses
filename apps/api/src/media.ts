export const maxHouseImageBytes = 2 * 1024 * 1024;

export type SupportedImage = {
  contentType: "image/png" | "image/jpeg" | "image/webp";
};

export function inspectHouseImage(bytes: Buffer): SupportedImage | null {
  if (bytes.length < 12 || bytes.length > maxHouseImageBytes) return null;
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { contentType: "image/png" };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { contentType: "image/jpeg" };
  }
  if (bytes.subarray(0, 4).equals(Buffer.from("RIFF")) && bytes.subarray(8, 12).equals(Buffer.from("WEBP"))) {
    return { contentType: "image/webp" };
  }
  return null;
}
