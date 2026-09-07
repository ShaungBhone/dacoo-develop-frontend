import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@dacoo/ui"],
  async redirects() {
    return [
      { source: "/customers", destination: "/contacts", permanent: true },
      { source: "/customers/:id", destination: "/contacts/:id", permanent: true },
    ]
  },
}

export default nextConfig
