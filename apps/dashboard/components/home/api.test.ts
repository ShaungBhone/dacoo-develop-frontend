import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiFetch } from "@/lib/api"
import {
  fetchHome,
  sendHomeMessage,
  decideHomeAction,
  updateHomeItem,
} from "./api"
vi.mock("@/lib/api", () => ({ apiFetch: vi.fn().mockResolvedValue({}) }))
beforeEach(() => vi.clearAllMocks())
describe("Home API", () => {
  it("scopes saved history and board loading to the active organization", async () => {
    await fetchHome("publicOrg")
    expect(apiFetch).toHaveBeenCalledWith(
      "/api/v1/organizations/publicOrg/home"
    )
  })
  it("sends selected customer context and local timezone to the assistant", async () => {
    await sendHomeMessage(
      "org",
      "Save this phone number",
      "customerConversation"
    )
    expect(apiFetch).toHaveBeenCalledWith(
      "/api/v1/organizations/org/home/messages",
      expect.objectContaining({
        method: "POST",
        body: expect.objectContaining({
          conversation_id: "customerConversation",
          timezone: expect.any(String),
        }),
      })
    )
  })
  it("confirms the stored preview without sending a replacement action payload", async () => {
    await decideHomeAction("org", "proposal", "confirm")
    expect(apiFetch).toHaveBeenCalledWith(
      "/api/v1/organizations/org/home/messages/proposal/confirm",
      { method: "POST" }
    )
  })
  it("updates review status without changing the financial ledger", async () => {
    await updateHomeItem("org", "card", { status: "done" })
    expect(apiFetch).toHaveBeenCalledWith(
      "/api/v1/organizations/org/home/items/card",
      { method: "PATCH", body: { status: "done" } }
    )
  })
})
