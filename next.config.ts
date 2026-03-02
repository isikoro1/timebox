import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production"
const repo = "timebox"

const nextConfig: NextConfig = {
  output: "export", // static export（App Routerはこれ）:contentReference[oaicite:2]{index=2}
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}/` : "",
}

export default nextConfig;
