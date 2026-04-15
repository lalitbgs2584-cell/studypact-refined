import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: [
    "socket.io",
    "socket.io-client",
    "better-auth",        // ← CRITICAL: prevents Turbopack from bundling it
    "@prisma/client",     // ← prevents bundling, lets Neon adapter work
    "@prisma/adapter-neon"
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
