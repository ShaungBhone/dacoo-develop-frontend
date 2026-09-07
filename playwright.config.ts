import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  use: {
    baseURL: "http://docs.localhost:3001",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: "bun run dev:dashboard",
      url: "http://dashboard.localhost:3000/login",
      reuseExistingServer: true,
    },
    {
      command: "bun run dev:docs",
      url: "http://docs.localhost:3001/auth/callback",
      reuseExistingServer: true,
    },
  ],
})
