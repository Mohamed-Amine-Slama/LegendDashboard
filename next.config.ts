import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow loading product images from any remote host (Cloudinary, S3, etc).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
