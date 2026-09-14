import { describe, expect, it } from "vitest"

import {
  localeComplete,
  selectLabel,
  VIBER_CAROUSEL_IMAGE_REQUIREMENTS,
} from "./viber-experience-editor"
import type { ViberExperienceRevision } from "./viber-experience-api"

function revision(): ViberExperienceRevision {
  return {
    id: "revision",
    default_locale: "en",
    enabled_locales: ["en", "my"],
    welcome_text: { en: "Welcome", my: "ကြိုဆိုပါတယ်" },
    menu_text: { en: "Menu", my: "မီနူး" },
    fallback_text: { en: "Please wait", my: "စောင့်ပါ" },
    handoff_text: { en: "Agent notified", my: "ဝန်ထမ်းကို အသိပေးပြီး" },
    menu_buttons: [
      {
        label: { en: "Agent", my: "ဝန်ထမ်း" },
        action_type: "handoff",
        action_value: { en: "agent", my: "ဝန်ထမ်း" },
        background_color: "#7360F2",
      },
    ],
    automations: [
      {
        name: "Handoff",
        response_type: "handoff",
        triggers: { en: ["agent"], my: ["ဝန်ထမ်း"] },
        response_text: null,
        show_menu: false,
        is_enabled: true,
        cards: [],
      },
    ],
  }
}

describe("Viber editor locale validation", () => {
  it("marks a complete enabled locale ready to publish", () => {
    expect(localeComplete(revision(), "en")).toBe(true)
    expect(localeComplete(revision(), "my")).toBe(true)
  })

  it("does not borrow a default-language translation for another locale", () => {
    const draft = revision()
    delete draft.welcome_text.my

    expect(localeComplete(draft, "my")).toBe(false)
  })

  it("requires image-backed complete carousel cards", () => {
    const draft = revision()
    draft.automations = [
      {
        name: "Cards",
        response_type: "carousel",
        triggers: { en: ["cards"], my: ["ကတ်"] },
        response_text: { en: "Cards", my: "ကတ်များ" },
        show_menu: false,
        is_enabled: true,
        cards: [
          {
            title: { en: "Service", my: "ဝန်ဆောင်မှု" },
            description: { en: "Details", my: "အသေးစိတ်" },
            cta_label: { en: "Open", my: "ဖွင့်မည်" },
            action_type: "open_url",
            action_value: {
              en: "https://example.com",
              my: "https://example.com/my",
            },
            image_url: null,
          },
        ],
      },
    ]

    expect(localeComplete(draft, "en")).toBe(false)
    draft.automations[0]!.cards[0]!.image_url = "https://example.com/card.png"
    expect(localeComplete(draft, "en")).toBe(true)
  })
})

describe("Viber editor select labels", () => {
  it("shows the human-readable label instead of the stored API value", () => {
    const options = [
      { value: "open_url", label: "URL" },
      { value: "share-phone", label: "Share phone" },
    ]

    expect(selectLabel(options, "open_url")).toBe("URL")
    expect(selectLabel(options, "share-phone")).toBe("Share phone")
  })
})

describe("Viber carousel image requirements", () => {
  it("uses the documented upload limit and the editor crop dimensions", () => {
    expect(VIBER_CAROUSEL_IMAGE_REQUIREMENTS).toMatchObject({
      width: 800,
      height: 450,
      maxBytes: 512_000,
      acceptedTypes: ["image/jpeg", "image/png"],
    })
  })
})
