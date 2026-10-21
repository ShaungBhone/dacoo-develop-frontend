import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { HomepagePromptFrame } from "@/components/examples/c-frame-10"
import { HomeView } from "./home-view"

vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ user: { name: "Shaun" } }),
}))
vi.mock("@/hooks/use-active-organization", () => ({
  useActiveOrganization: () => ({ id: "workspace" }),
}))
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}))

describe("Existing Home prompt", () => {
  it("keeps the original greeting and Frame composer and places the board underneath", () => {
    const markup = renderToStaticMarkup(<HomeView />)
    expect(markup).toContain("Good morning, Shaun")
    expect(markup).toContain('id="homepage-prompt"')
    expect(markup).toContain('data-slot="frame-panel"')
    expect(markup.indexOf('id="homepage-prompt"')).toBeLessThan(
      markup.indexOf('aria-label="Workspace board"')
    )
    expect(markup).not.toContain("What needs your attention, Shaun?")
    expect(markup).not.toContain("You’re out of tokens")
  })

  it("connects a draft to a usable submit control instead of the demo token restriction", () => {
    const markup = renderToStaticMarkup(
      <HomepagePromptFrame value="Plan a meeting" onSend={vi.fn()} />
    )
    expect(markup).toContain("Plan a meeting")
    expect(markup).toMatch(/<button[^>]*aria-label="Submit prompt"[^>]*>/)
    const submit = markup.match(
      /<button[^>]*aria-label="Submit prompt"[^>]*>/
    )?.[0]
    expect(submit).not.toMatch(/\sdisabled(?:=|\s|>)/)
    expect(markup).not.toContain("v0 Mini")
    expect(markup).not.toContain("Website redesign")
  })

  it("prevents submitting again while a message is pending", () => {
    const markup = renderToStaticMarkup(
      <HomepagePromptFrame value="Hello" isSubmitting onSend={vi.fn()} />
    )
    const submit = markup.match(
      /<button[^>]*aria-label="Submit prompt"[^>]*>/
    )?.[0]
    expect(submit).toMatch(/\sdisabled(?:=|\s|>)/)
  })
})
