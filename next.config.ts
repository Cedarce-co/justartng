import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    return [{ source: "/gallery", destination: "/visual-studio", permanent: false }];
  },
  images: {
    formats: ["image/webp"],
  },
};

export default nextConfig;
