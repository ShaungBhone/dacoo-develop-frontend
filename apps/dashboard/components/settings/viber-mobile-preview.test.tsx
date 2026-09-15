import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import {
  resolveViberCarouselAction,
  safeViberPreviewUrl,
  ViberMobilePreview,
} from "./viber-mobile-preview"
import type { ViberExperienceRevision } from "./viber-experience-api"

function sampleRevision(): ViberExperienceRevision {
  return {
    id: "rev-1",
    default_locale: "en",
    enabled_locales: ["en", "my"],
    welcome_text: { en: "Hello from Viber Bot!", my: "မင်္ဂလာပါ" },
    menu_text: { en: "Choose an option", my: "ရွေးချယ်ပါ" },
    fallback_text: { en: "I didn't understand that", my: "နားမလည်ပါ" },
    handoff_text: { en: "Connecting to agent", my: "ချိတ်ဆက်နေပါသည်" },
    menu_buttons: [
      {
        label: { en: "Support Team", my: "အကူအညီ" },
        action_type: "handoff",
        action_value: { en: "support", my: "support" },
        background_color: "#7360F2",
      },
      {
        label: { en: "Visit Website", my: "ဝက်ဘ်ဆိုက်" },
        action_type: "open_url",
        action_value: { en: "https://example.com", my: "https://example.com" },
        background_color: "#38B000",
      },
    ],
    automations: [
      {
        name: "Welcome Cards",
        response_type: "carousel",
        triggers: { en: ["cards"] },
        response_text: { en: "Check our services" },
        show_menu: false,
        is_enabled: true,
        cards: [
          {
            title: { en: "Consultation" },
            description: { en: "Free 30-min call" },
            cta_label: { en: "Book Now" },
            action_type: "open_url",
            action_value: { en: "https://example.com/book" },
            image_url: "https://example.com/image.jpg",
          },
        ],
      },
    ],
  }
}

describe("ViberMobilePreview", () => {
  it("renders a neutral full-height automation preview header", () => {
    const markup = renderToStaticMarkup(
      createElement(ViberMobilePreview, {
        revision: sampleRevision(),
        locale: "en",
        onClose: vi.fn(),
      })
    )

    expect(markup).toContain("Automation preview")
    expect(markup).toContain("Viber · EN")
    expect(markup).toContain("h-full")
    expect(markup).toContain('aria-label="Reset conversation"')
    expect(markup).toContain('aria-label="Close automation preview"')
    expect(markup).not.toContain("h-[620px]")
    expect(markup).not.toContain("max-w-[380px]")
    expect(markup).not.toContain("bg-[#7360F2]")
    expect(markup).not.toContain("Online")
    expect(markup).not.toContain("Today")
  })

  it("renders the welcome message inside the chat stream", () => {
    const markup = renderToStaticMarkup(
      createElement(ViberMobilePreview, {
        revision: sampleRevision(),
        locale: "en",
      })
    )

    expect(markup).toContain("Hello from Viber Bot!")
    expect(markup).toContain('data-slot="message-group"')
    expect(markup).toContain('data-slot="message"')
    expect(markup).toContain('data-slot="message-avatar"')
    expect(markup).toContain('data-slot="message-header"')
    expect(markup).toContain('data-slot="bubble"')
    expect(markup).toContain('data-variant="outline"')
  })

  it("renders localized text for another locale", () => {
    const markup = renderToStaticMarkup(
      createElement(ViberMobilePreview, {
        revision: sampleRevision(),
        locale: "my",
      })
    )

    expect(markup).toContain("မင်္ဂလာပါ")
    expect(markup).toContain("အကူအညီ")
  })

  it("renders docked bot menu buttons with labels and custom colors", () => {
    const markup = renderToStaticMarkup(
      createElement(ViberMobilePreview, {
        revision: sampleRevision(),
        locale: "en",
      })
    )

    expect(markup).toContain("Support Team")
    expect(markup).toContain("Visit Website")
    expect(markup).toContain("Menu actions")
    expect(markup).toContain("Type message")
    expect(markup).toContain("background-color:#38B000")
  })

  it("renders the Viber composer with the ReUI input group pattern", () => {
    const markup = renderToStaticMarkup(
      createElement(ViberMobilePreview, {
        revision: sampleRevision(),
        locale: "en",
      })
    )

    expect(markup).toContain("Type a message...")
    expect(markup).toContain('data-slot="field"')
    expect(markup).toContain('data-slot="input-group"')
    expect(markup).toContain('data-slot="input-group-addon"')
    expect(markup).toContain('data-slot="input-group-control"')
    expect(markup).toContain('type="text"')
    expect(markup).not.toContain("<textarea")
    expect(markup).not.toContain('aria-label="Add attachment"')
    expect(markup).not.toContain('aria-label="Insert sticker or emoji"')
    expect(markup).not.toContain('aria-label="Voice message"')
    expect(markup).toContain('aria-label="Send message"')
    expect(markup).not.toContain("Send test to Viber contact")
  })

  it("renders a separate Send Test action without replacing local typing", () => {
    const markup = renderToStaticMarkup(
      createElement(ViberMobilePreview, {
        revision: sampleRevision(),
        locale: "en",
        sendTest: {
          conversations: [{ id: "conversation-1", label: "Jane Doe" }],
          activeConversationId: null,
          remainingSeconds: 0,
          disabled: false,
          status: "idle",
          onStart: vi.fn(async () => true),
          onStop: vi.fn(async () => true),
        },
      })
    )

    expect(markup).toContain("Type a message...")
    expect(markup).toContain('aria-label="Send test to Viber contact"')
    expect(markup).toContain('aria-label="Send message"')
  })

  it("announces active and loading Send Test states from the composer", () => {
    const activeMarkup = renderToStaticMarkup(
      createElement(ViberMobilePreview, {
        revision: sampleRevision(),
        locale: "en",
        sendTest: {
          conversations: [{ id: "conversation-1", label: "Jane Doe" }],
          activeConversationId: "conversation-1",
          remainingSeconds: 299,
          disabled: false,
          status: "idle",
          onStart: vi.fn(async () => true),
          onStop: vi.fn(async () => true),
        },
      })
    )
    const loadingMarkup = renderToStaticMarkup(
      createElement(ViberMobilePreview, {
        revision: sampleRevision(),
        locale: "en",
        sendTest: {
          conversations: [],
          activeConversationId: null,
          remainingSeconds: 0,
          disabled: true,
          status: "starting",
          onStart: vi.fn(async () => true),
          onStop: vi.fn(async () => true),
        },
      })
    )

    expect(activeMarkup).toContain(
      'aria-label="Preview active, 5 minutes remaining"'
    )
    expect(loadingMarkup).toContain('aria-label="Sending test preview"')
    expect(loadingMarkup).toContain("disabled")
  })

  it("renders carousel cards when an automation is focused", () => {
    const rev = sampleRevision()
    const markup = renderToStaticMarkup(
      createElement(ViberMobilePreview, {
        revision: rev,
        locale: "en",
        automation: rev.automations[0],
      })
    )

    expect(markup).toContain("Consultation")
    expect(markup).toContain("Free 30-min call")
    expect(markup).toContain("Book Now")
    expect(markup).toContain('data-slot="carousel"')
    expect(markup).toContain('data-slot="carousel-item"')
    expect(markup).toContain('data-slot="carousel-previous"')
    expect(markup).toContain('data-slot="carousel-next"')
    expect(markup).toContain('data-slot="card"')
    expect(markup).toContain("basis-[70%]")
    expect(markup).toContain('href="https://example.com/book"')
    expect(markup).toContain('target="_blank"')
    expect(markup).toContain('rel="noopener noreferrer"')
  })
})

describe("Viber carousel preview actions", () => {
  it("resolves reply actions against enabled automation triggers", () => {
    const revision = sampleRevision()
    const result = resolveViberCarouselAction(revision, "en", {
      title: { en: "More services" },
      description: null,
      cta_label: { en: "Show cards" },
      action_type: "reply",
      action_value: { en: "cards" },
    })

    expect(result).toMatchObject({
      userText: "Show cards",
      responseText: "Check our services",
      automation: revision.automations[0],
    })
  })

  it("resolves handoff actions with the localized handoff response", () => {
    const result = resolveViberCarouselAction(sampleRevision(), "my", {
      title: { en: "Support" },
      description: null,
      cta_label: { en: "Contact support", my: "အကူအညီ" },
      action_type: "handoff",
      action_value: { en: "support" },
    })

    expect(result).toMatchObject({
      userText: "အကူအညီ",
      responseText: "ချိတ်ဆက်နေပါသည်",
      isHandoff: true,
    })
  })

  it("allows only safe HTTP URLs for external card actions", () => {
    expect(safeViberPreviewUrl("https://example.com/book")).toBe(
      "https://example.com/book"
    )
    expect(safeViberPreviewUrl("javascript:alert(1)")).toBeNull()
    expect(safeViberPreviewUrl("not a url")).toBeNull()
  })
})
