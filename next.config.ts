import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/*": ["./prisma/dev.db"],
    "/api/**/*": ["./prisma/dev.db"]
  }
};

export default nextConfig;
