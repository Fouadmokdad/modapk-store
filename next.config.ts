import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from external sources (Play Store icons, Cloudinary, etc.)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "play-lh.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "modyolo.com",
      },
      {
        protocol: "https",
        hostname: "www.modyolo.com",
      },
      {
        protocol: "https",
        hostname: "liteapks.com",
      },
      {
        protocol: "https",
        hostname: "www.liteapks.com",
      },
      {
        protocol: "https",
        hostname: "getmodsapk.com",
      },
      {
        protocol: "https",
        hostname: "www.getmodsapk.com",
      },
      {
        protocol: "https",
        hostname: "gamedva.com",
      },
      {
        protocol: "https",
        hostname: "www.gamedva.com",
      },
      {
        protocol: "https",
        hostname: "apkpure.com",
      },
      {
        protocol: "https",
        hostname: "www.apkpure.com",
      },
      {
        protocol: "https",
        hostname: "apkcombo.com",
      },
      {
        protocol: "https",
        hostname: "www.apkcombo.com",
      },
      {
        protocol: "https",
        hostname: "uptodown.com",
      },
      {
        protocol: "https",
        hostname: "*.uptodown.com",
      },
      {
        protocol: "https",
        hostname: "happymod.com",
      },
      {
        protocol: "https",
        hostname: "www.happymod.com",
      },
    ],
  },

  // Security headers
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    },
  ],

  // Enable server-side external packages
  serverExternalPackages: ["google-play-scraper", "bcryptjs", "pg", "@prisma/adapter-pg"],
};

export default nextConfig;
