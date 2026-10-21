import { resolve } from "node:path"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ exists: vi.fn(), load: vi.fn() }))
vi.mock("node:fs", () => ({ existsSync: mocks.exists }))
vi.mock("node:process", () => ({ loadEnvFile: mocks.load }))
beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

describe("Dashboard environment", () => {
  it("loads the workspace environment when Next runs inside apps/dashboard", async () => {
    mocks.exists.mockReturnValue(true)
    await import("./next.config")
    expect(mocks.load).toHaveBeenNthCalledWith(
      1,
      resolve(process.cwd(), "../../.env.local")
    )
    expect(mocks.load).toHaveBeenNthCalledWith(
      2,
      resolve(process.cwd(), "../../.env")
    )
  })
  it("does not require local environment files in deployment", async () => {
    mocks.exists.mockReturnValue(false)
    const config = (await import("./next.config")).default
    expect(mocks.load).not.toHaveBeenCalled()
    expect(config.transpilePackages).toContain("@dacoo/ui")
  })
})
