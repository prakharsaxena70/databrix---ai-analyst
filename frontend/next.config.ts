import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // @ts-ignore
  allowedDevOrigins: ["localhost:3000", "127.0.0.1:3000", "0.0.0.0:3000"],
  output: 'standalone',
};

export default nextConfig;
