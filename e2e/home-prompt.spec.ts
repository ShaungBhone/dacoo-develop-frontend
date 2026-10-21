import { expect, test } from "@playwright/test"

const dashboardUrl = "http://dashboard.localhost:3000"
const agentPath = "**/api/v1/organizations/11/agents"
const organizations = [
  { id: 11, name: "Sales workspace", slug: "sales", owner_id: 1 },
  { id: 22, name: "Support workspace", slug: "support", owner_id: 1 },
]
const agentFixtures = [
  {
    id: "sales01",
    name: "Sales assistant",
    isPrimary: false,
    status: "inactive",
  },
  {
    id: "support02",
    name: "Support assistant",
    isPrimary: true,
    status: "active",
  },
  {
    id: "draft03",
    name: "Operations draft",
    isPrimary: false,
    status: "draft",
  },
]

test.beforeEach(async ({ context, page }) => {
  await context.addCookies([
    { name: "auth_token", value: "home-design-test", url: dashboardUrl },
    { name: "onboarding_completed", value: "1", url: dashboardUrl },
  ])
  await context.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname
    await route.fulfill({
      json:
        path === "/api/user"
          ? {
              id: 1,
              name: "Hannah Smith",
              email: "hannah@example.test",
              avatar_url: null,
              onboarding_completed: true,
              organizations,
            }
          : path === "/api/v1/organizations/11/agents"
            ? { data: agentFixtures }
            : { data: [], unread_count: 0 },
    })
  })
  await page.goto(`${dashboardUrl}/home`)
  await expect(
    page.getByRole("heading", { name: "Good morning, Hannah" })
  ).toBeVisible()
  await expect(
    page.getByRole("tab", { name: "Support assistant", exact: true })
  ).toHaveAttribute("aria-selected", "true")
})

test("suggestions and examples fill the composer without sending; submission preserves the draft", async ({
  page,
}) => {
  const prompt = page.getByRole("textbox", { name: "Ask Dacoo" })
  const send = page.getByRole("button", { name: "Submit prompt" })
  for (const name of [
    "Add attachment",
    "Mention context",
    "Skills",
    "Voice input preview",
    "Submit prompt",
    "Refresh",
    "Expand",
  ]) {
    const button = page
      .getByRole("region", { name: "Home assistant" })
      .getByRole("button", { name, exact: true })
    expect((await button.boundingBox())?.height).toBe(32)
  }
  await expect(send).toBeDisabled()
  await prompt.fill("   ")
  await prompt.press("Control+Enter")
  await expect(
    page.getByText("Enter a prompt first.", { exact: true })
  ).toBeVisible()

  for (const label of [
    "Message someone",
    "Summarise contract",
    "Email customer",
    "Add note",
  ]) {
    const suggestion = page.getByRole("button", { name: label, exact: true })
    expect((await suggestion.boundingBox())?.height).toBe(32)
    expect(
      await suggestion.evaluate(
        (element) => getComputedStyle(element).boxShadow
      )
    ).toBe("none")
    await suggestion.click()
    await expect(prompt).toBeFocused()
    await expect(prompt).not.toHaveValue("")
  }
  await page
    .getByRole("button", {
      name: "Generate a quarterly sales report for Acme Corp",
      exact: true,
    })
    .click()
  await expect(prompt).toBeFocused()
  await expect(prompt).toHaveValue(/Generate a quarterly sales report/)

  await page.getByRole("combobox", { name: "Select preview model" }).click()
  await page.getByRole("option", { name: "v0 Max", exact: true }).click()
  await expect(
    page.getByRole("combobox", { name: "Select preview model" })
  ).toContainText("v0 Max")

  await prompt.fill("Follow up with this customer.")
  await prompt.press("End")
  await prompt.press("Enter")
  await prompt.press("a")
  await expect(prompt).toHaveValue("Follow up with this customer.\na")
  await send.click()
  await expect(
    page.getByText("AI chat isn’t connected in this preview", { exact: true })
  ).toBeVisible()
  await expect(prompt).toHaveValue("Follow up with this customer.\na")
  await prompt.fill("A second draft")
  await prompt.press("Control+Enter")
  await expect(prompt).toHaveValue("A second draft")
  await prompt.press("Meta+Enter")
  await expect(prompt).toHaveValue("A second draft")
  await page.reload()
  await expect(prompt).toHaveValue("")
  await page.goto(dashboardUrl)
  await expect(page).toHaveURL(`${dashboardUrl}/home`)
})

test("attachments deduplicate and remove; home fits light and dark mobile and desktop layouts", async ({
  page,
}, testInfo) => {
  const file = {
    name: "customer-notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Customer notes"),
  }
  const input = page.getByLabel("Choose attachments")
  await input.setInputFiles(file)
  await input.setInputFiles(file)
  await expect(page.getByText(file.name, { exact: true })).toHaveCount(1)
  await page
    .getByRole("textbox", { name: "Ask Dacoo" })
    .fill("Review these notes")
  await page.getByRole("button", { name: "Submit prompt" }).click()
  await expect(page.getByText(file.name, { exact: true })).toBeVisible()
  await page.getByRole("button", { name: `Remove ${file.name}` }).click()
  await expect(page.getByText(file.name, { exact: true })).toHaveCount(0)

  await input.setInputFiles({
    name: "customer.png",
    mimeType: "image/png",
    buffer: Buffer.from("preview"),
  })
  await expect(page.getByText("customer.png", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Remove customer.png" }).click()
  await page
    .getByRole("textbox", { name: "Ask Dacoo" })
    .fill("Customer context. ".repeat(200))
  await expect(
    page.getByRole("button", { name: "Submit prompt" })
  ).toBeVisible()

  await page.reload()
  if (testInfo.project.name === "desktop") {
    await page.setViewportSize({ width: 1920, height: 910 })
    const composer = page.locator('[data-slot="frame-panel"]')
    const box = await composer.boundingBox()
    expect(box?.width).toBe(672)
    expect(box?.height).toBeGreaterThanOrEqual(108)
    expect(box?.height).toBeLessThanOrEqual(116)
    const cards = page
      .getByRole("region", { name: "Previous chats" })
      .locator('[data-slot="card"]')
    await expect(cards).toHaveCount(5)
    const boxes = await cards.evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().top)
    )
    expect(new Set(boxes).size).toBe(1)
  }
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: theme })
    await expect(page.locator("html")).toHaveClass(new RegExp(theme))
    const main = page.getByRole("region", { name: "Home assistant" })
    const separators = main.locator(
      '[data-slot="separator"][aria-orientation="vertical"]'
    )
    await expect(separators).toHaveCount(3)
    for (const separator of await separators.all()) {
      const geometry = await separator.evaluate((element) => {
        const bounds = element.getBoundingClientRect()
        const sibling = (element.previousElementSibling ??
          element.nextElementSibling)!.getBoundingClientRect()
        return {
          width: bounds.width,
          height: bounds.height,
          centerDifference: Math.abs(
            bounds.top + bounds.height / 2 - (sibling.top + sibling.height / 2)
          ),
        }
      })
      expect(geometry.width).toBe(1)
      expect(geometry.height).toBe(16)
      expect(geometry.centerDifference).toBeLessThanOrEqual(1)
    }
    expect(
      await main.evaluate(
        (element) => element.scrollWidth <= element.clientWidth
      )
    ).toBe(true)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true)
    await expect(
      page.getByRole("button", { name: "Submit prompt" })
    ).toBeVisible()
    await page.screenshot({
      path: testInfo.outputPath(`home-${theme}.png`),
      fullPage: true,
    })
    await page.locator('[data-slot="frame-panel"]').screenshot({
      path: testInfo.outputPath(`composer-${theme}.png`),
    })
    await page.getByRole("tablist", { name: "Agents" }).screenshot({
      path: testInfo.outputPath(`agent-tabs-${theme}.png`),
    })
  }
})

test("agent tabs, skills, and history controls work without suggested applications", async ({
  page,
}) => {
  await expect(page.getByRole("tablist", { name: "Agents" })).toHaveAttribute(
    "data-variant",
    "ghost"
  )
  const tabLayout = await page
    .getByRole("tablist", { name: "Agents" })
    .evaluate((element) => {
      const list = element.getBoundingClientRect()
      return {
        fits:
          element.scrollWidth <= element.clientWidth &&
          element.scrollHeight <= element.clientHeight,
        tabsFit: [...element.querySelectorAll('[role="tab"]')].every((tab) => {
          const rect = tab.getBoundingClientRect()
          return rect.left >= list.left && rect.right <= list.right + 1
        }),
        indicatorsHidden: [...element.querySelectorAll('[role="tab"]')].every(
          (tab) => getComputedStyle(tab, "::after").display === "none"
        ),
      }
    })
  expect(tabLayout).toEqual({
    fits: true,
    tabsFit: true,
    indicatorsHidden: true,
  })
  await page.getByRole("tab", { name: "Sales assistant", exact: true }).click()
  await expect(
    page.getByRole("tab", { name: "Sales assistant", exact: true })
  ).toHaveAttribute("aria-selected", "true")
  await expect(
    page.getByText("I’m Sales assistant, where should we start today?")
  ).toBeVisible()
  await page.getByRole("button", { name: "Skills", exact: true }).click()
  await page
    .getByRole("menuitem", { name: "Summarise contract", exact: true })
    .click()
  await expect(page.getByRole("textbox", { name: "Ask Dacoo" })).toHaveValue(
    /Summarise this customer contract/
  )
  const previous = page.getByRole("region", { name: "Previous chats" })
  await previous.getByRole("button", { name: "Refresh", exact: true }).click()
  await expect(previous.locator('[data-slot="card"]').first()).toContainText(
    "Analyze customer feedback"
  )
  await previous.getByRole("button", { name: "Expand", exact: true }).click()
  await expect(
    previous.getByRole("button", { name: "Collapse", exact: true })
  ).toHaveAttribute("aria-expanded", "true")
  await expect(
    page.getByRole("region", { name: "Suggested applications" })
  ).toHaveCount(0)
})

test("uses API order, IDs, primary selection and real creation/settings links", async ({
  page,
}) => {
  const tabs = page.getByRole("tablist", { name: "Agents" }).getByRole("tab")
  await expect(tabs).toHaveText(agentFixtures.map((agent) => agent.name))
  await expect(
    page.getByRole("link", { name: "Add Agent", exact: true })
  ).toHaveAttribute("href", "/agents/new")
  await expect(
    page.getByRole("link", { name: "Settings", exact: true })
  ).toHaveAttribute("href", "/agents/support02")
  await page.getByRole("tab", { name: "Operations draft", exact: true }).click()
  await expect(
    page.getByRole("link", { name: "Settings", exact: true })
  ).toHaveAttribute("href", "/agents/draft03")
  await expect(
    page.getByText("I’m Operations draft, where should we start today?")
  ).toBeVisible()

  await page.route(agentPath, (route) =>
    route.fulfill({
      json: {
        data: [
          { ...agentFixtures[0], name: "Same name" },
          { ...agentFixtures[1], name: "Same name", isPrimary: false },
          ...Array.from({ length: 6 }, (_, index) => ({
            ...agentFixtures[2],
            id: `longname${index}`,
            name: `Customer success assistant ${index} for international accounts and enterprise customer onboarding`,
          })),
        ],
      },
    })
  )
  await page.reload()
  const duplicates = page.getByRole("tab", { name: "Same name", exact: true })
  await expect(duplicates).toHaveCount(2)
  await expect(duplicates.first()).toHaveAttribute("aria-selected", "true")
  await expect(
    page.getByRole("link", { name: "Settings", exact: true })
  ).toHaveAttribute("href", "/agents/sales01")
  await duplicates.nth(1).click()
  await expect(
    page.getByRole("link", { name: "Settings", exact: true })
  ).toHaveAttribute("href", "/agents/support02")
  const tablist = page.getByRole("tablist", { name: "Agents" })
  expect(
    await tablist.evaluate(
      (element) =>
        element.scrollWidth <= element.clientWidth &&
        element.scrollHeight <= element.clientHeight
    )
  ).toBe(true)
  expect(
    await page
      .getByRole("region", { name: "Home assistant" })
      .evaluate((element) => element.scrollWidth <= element.clientWidth)
  ).toBe(true)
})

test("shows empty and no-workspace states without invented agents", async ({
  page,
}) => {
  await page.route(agentPath, (route) => route.fulfill({ json: { data: [] } }))
  await page.reload()
  await expect(
    page.getByText("No agents yet. Add an agent to get started.")
  ).toBeVisible()
  await expect(page.getByRole("tablist", { name: "Agents" })).toHaveCount(0)
  await expect(
    page.getByRole("link", { name: "Settings", exact: true })
  ).toHaveCount(0)
  await expect(
    page.getByRole("link", { name: "Add Agent", exact: true })
  ).toHaveAttribute("href", "/agents/new")
  await page.route("**/api/user", (route) =>
    route.fulfill({
      json: {
        id: 1,
        name: "Hannah Smith",
        onboarding_completed: true,
        organizations: [],
      },
    })
  )
  await page.reload()
  await expect(
    page.getByText("Select a workspace to see its agents.")
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Add Agent", exact: true })
  ).toBeDisabled()
})

test("shows loading and recovers from an agent request failure", async ({
  page,
}) => {
  let release: () => void = () => {}
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  let shouldFail = true
  await page.route(agentPath, async (route) => {
    if (shouldFail) {
      await pending
      await route.fulfill({ status: 503, json: { message: "Unavailable" } })
    } else {
      await route.fulfill({ json: { data: agentFixtures } })
    }
  })
  try {
    await page.reload()
    await expect(
      page.getByRole("status", { name: "Loading agents" })
    ).toBeVisible()
    await expect(page.getByRole("tablist", { name: "Agents" })).toHaveCount(0)
    release()
    await expect(
      page.getByRole("region", { name: "Home assistant" }).getByRole("alert")
    ).toContainText("Couldn’t load agents.")
    shouldFail = false
    await page.getByRole("button", { name: "Retry", exact: true }).click()
    await expect(
      page.getByRole("tab", { name: "Support assistant", exact: true })
    ).toHaveAttribute("aria-selected", "true")
  } finally {
    release()
  }
})

test("workspace switches clear old agents and ignore late responses", async ({
  page,
}) => {
  let releaseOld: () => void = () => {}
  let releaseNew: () => void = () => {}
  const oldPending = new Promise<void>((resolve) => {
    releaseOld = resolve
  })
  const newPending = new Promise<void>((resolve) => {
    releaseNew = resolve
  })
  await page.route(agentPath, async (route) => {
    await oldPending
    await route.fulfill({
      json: { data: [{ ...agentFixtures[0], name: "Stale workspace agent" }] },
    })
  })
  await page.route("**/api/v1/organizations/22/agents", async (route) => {
    await newPending
    await route.fulfill({
      json: {
        data: [
          { ...agentFixtures[1], id: "neworg02", name: "New workspace agent" },
        ],
      },
    })
  })
  async function switchWorkspace(name: string) {
    const workspace = page.getByRole("button", {
      name: "Workspace",
      exact: true,
    })
    if (!(await workspace.isVisible()))
      await page
        .getByRole("button", { name: "Toggle Sidebar", exact: true })
        .first()
        .click()
    await workspace.click()
    await page.getByRole("menuitem", { name, exact: true }).click()
    await page.keyboard.press("Escape")
    if ((page.viewportSize()?.width ?? 0) < 768) {
      await expect(workspace).not.toBeVisible()
    }
  }
  try {
    await switchWorkspace("Support workspace")
    await expect(
      page.getByRole("status", { name: "Loading agents" })
    ).toBeVisible()
    await expect(page.getByRole("tablist", { name: "Agents" })).toHaveCount(0)
    await expect(
      page.getByRole("tab", { name: "Sales assistant", exact: true })
    ).toHaveCount(0)
    releaseNew()
    await expect(
      page.getByRole("tab", { name: "New workspace agent", exact: true })
    ).toHaveAttribute("aria-selected", "true")

    await switchWorkspace("Sales workspace")
    await expect(
      page.getByRole("status", { name: "Loading agents" })
    ).toBeVisible()
    await switchWorkspace("Support workspace")
    await expect(
      page.getByRole("tab", { name: "New workspace agent", exact: true })
    ).toHaveAttribute("aria-selected", "true")
    const oldResponse = page.waitForResponse((response) =>
      response.url().endsWith("/organizations/11/agents")
    )
    releaseOld()
    await oldResponse
    await expect(
      page.getByRole("tab", { name: "Stale workspace agent", exact: true })
    ).toHaveCount(0)
    await expect(
      page.getByRole("link", { name: "Settings", exact: true })
    ).toHaveAttribute("href", "/agents/neworg02")
  } finally {
    releaseOld()
    releaseNew()
  }
})
