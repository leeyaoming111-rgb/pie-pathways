import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The demo runtime is entirely client-side: no API routes, no data fetching,
  // no runtime network calls. Everything it knows comes from the committed
  // knowledge base bundled at build time.
  reactStrictMode: true,
};

export default nextConfig;
