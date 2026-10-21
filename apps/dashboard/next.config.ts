import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { loadEnvFile } from "node:process"
import type { NextConfig } from "next"

for (const name of [".env.local", ".env"]) {
  const workspaceEnv = resolve(process.cwd(), "../..", name)
  if (existsSync(workspaceEnv)) loadEnvFile(workspaceEnv)
}

const nextConfig: NextConfig = {
  transpilePackages: ["@dacoo/ui"],
  async redirects() {
    return [
      { source: "/customers", destination: "/contacts", permanent: true },
      {
        source: "/customers/:id",
        destination: "/contacts/:id",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
