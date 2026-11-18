import type { NextConfig } from "next";

// GitHub Pages serves static files only, so the whole site is exported to ./out at build time.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
