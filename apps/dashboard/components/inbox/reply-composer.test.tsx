import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { ReplyComposer } from "./reply-composer"

const props = {
  onSubmit: vi.fn(),
  onTakeOver: vi.fn(),
  isLoading: false,
  aiStateReason: null,
}

describe("Manion composer states", () => {
  it("shows standby for eligible chats and responding only during generation", () => {
    const idle = renderToStaticMarkup(
      <ReplyComposer {...props} aiHandler="ai-active" aiReplyStatus="idle" />
    )
    expect(idle).toContain(
      "Manion AI is enabled — waiting for the next message"
    )
    expect(idle).not.toContain("Manion AI is responding")
    const responding = renderToStaticMarkup(
      <ReplyComposer
        {...props}
        aiHandler="ai-active"
        aiReplyStatus="responding"
      />
    )
    expect(responding).toContain("Manion AI is responding")
    expect(responding).toContain("Take over")
  })

  it.each([
    ["insufficient_balance", "ran out of credits"],
    ["configuration_error", "check your default model and provider settings"],
    ["provider_error", "check the provider connection"],
    ["feature_unavailable", "unavailable on your current plan"],
    ["provider_policy", "messaging policy"],
  ])("explains the %s attention reason", (reason, copy) => {
    expect(
      renderToStaticMarkup(
        <ReplyComposer
          {...props}
          aiHandler="needs-attention"
          aiStateReason={reason}
        />
      )
    ).toContain(copy)
  })
})
