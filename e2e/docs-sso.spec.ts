import { expect, test, type Page } from "@playwright/test"

const email = process.env.E2E_USER_EMAIL
const password = process.env.E2E_USER_PASSWORD

async function signIn(page: Page, path: string) {
  await page.goto(path)
  if (page.url().includes("/login")) {
    await page.getByLabel("Email").fill(email!)
    await page.getByLabel("Password").fill(password!)
    await page.getByRole("button", { name: "Sign in" }).click()
  }
}

test.describe("authenticated documentation", () => {
  test("returns a signed-in customer to the requested guide", async ({ page, context }) => {
    test.skip(!email || !password, "Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run SSO tests.")
    await page.goto("/my/inbox")
    await expect(page).toHaveURL(/dashboard\.localhost:3000\/login\?next=/)

    await page.getByLabel("Email").fill(email!)
    await page.getByLabel("Password").fill(password!)
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page).toHaveURL("http://docs.localhost:3001/my/inbox")
    await expect(page.getByRole("heading", { level: 1, name: "Inbox" })).toBeVisible()

    const session = (await context.cookies()).find((cookie) => cookie.name === "dacoo_docs_token")
    expect(session).toMatchObject({ httpOnly: true, sameSite: "Lax", domain: "docs.localhost" })
  })

  test("supports search, locale switching, theme, and mobile navigation", async ({ page }, testInfo) => {
    test.skip(!email || !password, "Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run SSO tests.")
    await signIn(page, "/en/getting-started")
    await expect(page).toHaveURL("http://docs.localhost:3001/en/getting-started")

    await page.getByPlaceholder("Search the guide").fill("reranking")
    await expect(page.getByRole("button", { name: /Playground/ })).toBeVisible()
    await page.getByRole("link", { name: "မြန်မာ" }).click()
    await expect(page).toHaveURL(/\/my\/getting-started$/)
    await page.getByRole("button", { name: "Toggle theme" }).click()
    if (testInfo.project.name === "mobile") {
      await page.getByRole("button", { name: "လမ်းညွှန်မီနူး" }).click()
      await expect(page.getByRole("navigation", { name: "လမ်းညွှန်မီနူး" })).toBeVisible()
    }
  })
})
