import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/customers", destination: "/contacts", permanent: true },
      { source: "/customers/:id", destination: "/contacts/:id", permanent: true },
    ]
  },
}

export default nextConfig
