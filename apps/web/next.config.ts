import type { NextConfig } from "next";
import { resolve } from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  // Keep Turbopack inside this distributable project, not its Codex parent folder.
  turbopack: { root: resolve(import.meta.dirname, "../..") }
};

export default nextConfig;
