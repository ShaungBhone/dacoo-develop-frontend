import { beforeEach, describe, expect, it, vi } from "vitest"

import { apiFetch } from "@/lib/api"

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}))

import {
  fetchConversationMessages,
  effectiveAiHandler,
  workspaceAiOwnershipNotice,
  type Conversation,
} from "./api"

describe("fetchConversationMessages", () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset()
  })

  it("returns chronological messages and the cursor for the next older page", async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      data: [
        {
          id: "newer",
          direction: "inbound",
          sender: null,
          body: "Newer message",
          status: "sent",
          type: "text",
          sent_at: "2026-09-08T10:01:00Z",
        },
        {
          id: "older",
          direction: "outbound",
          sender: null,
          body: "Older message",
          status: "delivered",
          type: "text",
          sent_at: "2026-09-08T10:00:00Z",
        },
      ],
      meta: { next_cursor: "older-page-cursor" },
    })

    const page = await fetchConversationMessages("org", "conversation")

    expect(apiFetch).toHaveBeenCalledWith(
      "/api/v1/organizations/org/conversations/conversation/messages"
    )
    expect(page.messages.map((message) => message.id)).toEqual([
      "older",
      "newer",
    ])
    expect(page.nextCursor).toBe("older-page-cursor")
  })

  it("encodes the cursor when requesting an older page", async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      data: [],
      meta: { next_cursor: null },
    })

    await fetchConversationMessages("org", "conversation", "cursor+/=")

    expect(apiFetch).toHaveBeenCalledWith(
      "/api/v1/organizations/org/conversations/conversation/messages?cursor=cursor%2B%2F%3D"
    )
  })
})

describe("effective workspace AI ownership", () => {
  const conversation = {
    aiHandler: "human",
    workspaceAiEligible: true,
    workspaceAiBlockReason: null,
    assignee: null,
    status: "open",
  } as Conversation

  it("activates the composer for an eligible existing chat when Manion is enabled", () => {
    expect(effectiveAiHandler(conversation, true)).toBe("ai-active")
    expect(effectiveAiHandler(conversation, false)).toBe("human")
  })

  it("preserves explicit takeovers, assigned teammates, spam and human attention", () => {
    const takenOver = {
      ...conversation,
      workspaceAiEligible: false,
      workspaceAiBlockReason: "human_takeover",
    }
    expect(effectiveAiHandler(takenOver, true)).toBe("human")
    expect(workspaceAiOwnershipNotice(takenOver)).toContain("took over")
    expect(
      effectiveAiHandler(
        {
          ...conversation,
          assignee: { id: 1, name: "Teammate", avatarUrl: null },
        },
        true
      )
    ).toBe("human")
    expect(effectiveAiHandler({ ...conversation, status: "spam" }, true)).toBe(
      "human"
    )
    expect(
      effectiveAiHandler(
        {
          ...conversation,
          aiHandler: "needs-attention",
          workspaceAiEligible: false,
        },
        true
      )
    ).toBe("needs-attention")
  })
})
