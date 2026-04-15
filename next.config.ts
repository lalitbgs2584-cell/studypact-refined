import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // next.config.ts
  serverExternalPackages: [
    "socket.io",
    "socket.io-client",
    "@prisma/client",
    "@prisma/adapter-neon",
    "@prisma/adapter-pg",
    "pg",
    "dotenv",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "*.ufs.sh" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
