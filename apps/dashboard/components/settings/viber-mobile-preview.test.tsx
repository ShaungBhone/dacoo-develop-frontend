import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ViberMobilePreview } from "./viber-mobile-preview"
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
  it("renders the authentic Viber purple header and bot identity", () => {
    const markup = renderToStaticMarkup(
      createElement(ViberMobilePreview, {
        revision: sampleRevision(),
        locale: "en",
      })
    )

    expect(markup).toContain("bg-[#7360F2]")
    expect(markup).toContain("Viber Bot")
    expect(markup).toContain("Online")
  })

  it("renders the welcome message inside the chat stream", () => {
    const markup = renderToStaticMarkup(
      createElement(ViberMobilePreview, {
        revision: sampleRevision(),
        locale: "en",
      })
    )

    expect(markup).toContain("Hello from Viber Bot!")
    expect(markup).toContain("Today")
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
    expect(markup).toContain("Bot Menu")
    expect(markup).toContain("background-color:#38B000")
  })

  it("renders the Viber bottom input bar with placeholder", () => {
    const markup = renderToStaticMarkup(
      createElement(ViberMobilePreview, {
        revision: sampleRevision(),
        locale: "en",
      })
    )

    expect(markup).toContain("Type a message...")
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
  })
})
