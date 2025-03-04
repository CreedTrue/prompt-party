import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pollinations.ai",
        pathname: "/p/**",
      },
    ],
  },
};

export default nextConfig;
