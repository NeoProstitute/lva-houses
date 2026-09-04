import type { NextConfig } from "next";
import { resolve } from "node:path";

const nextConfig: NextConfig = {
  output: process.env.GITHUB_ACTIONS === "true" ? "export" : "standalone",
  basePath: process.env.GITHUB_ACTIONS === "true" ? "/lva-houses" : undefined,
  assetPrefix: process.env.GITHUB_ACTIONS === "true" ? "/lva-houses" : undefined,
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
  // Keep Turbopack inside this distributable project, not its Codex parent folder.
  turbopack: { root: resolve(import.meta.dirname, "../..") }
};

export default nextConfig;
