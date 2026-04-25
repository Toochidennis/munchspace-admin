import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dev.munchspace.io",
        port: "",
        pathname: "/storage/**",
      },
    ],
  },
};

export default nextConfig;
