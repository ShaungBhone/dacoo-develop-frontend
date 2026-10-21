import { expect, test } from "@playwright/test"

const dashboardUrl = "http://dashboard.localhost:3000"
const conversation = {
  id: "conversation",
  last_message_at: "2026-10-21T10:00:00Z",
  last_message_preview: "Can you help?",
  status: "open",
  priority: "normal",
  unread_count: 0,
  ai_handler: "ai-active",
  assignee: null,
  customer: {
    id: "contact",
    display_name: "Assignment Test Customer",
    avatar_url: null,
    is_online: false,
    external_id: "external",
    metadata: {},
    last_seen_at: null,
  },
  inbox: { id: "inbox", name: "Support", provider: "telegram" },
  tags: [],
}

test("workspace settings control AI and Inbox keeps human assignment", async ({
  page,
  context,
}, testInfo) => {
  await context.addCookies([
    { name: "auth_token", value: "assignment-test", url: dashboardUrl },
    { name: "onboarding_completed", value: "1", url: dashboardUrl },
  ])
  let settingsReads = 0
  let settings = {
    auto_assign: false,
    auto_reply: false,
    primary_agent_id: null as string | null,
    default_model: null as string | null,
    follow_up_enabled: true,
  }
  let saved = false
  let takenOver = false
  await context.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname
    let json: unknown = {
      data: [],
      meta: { next_cursor: null },
      unread_count: 0,
    }
    if (path === "/api/user") {
      json = {
        id: 1,
        name: "Test Owner",
        email: "owner@example.test",
        onboarding_completed: true,
        organizations: [
          {
            id: 11,
            name: "Support workspace",
            slug: "support",
            owner_id: 1,
            is_owner: true,
          },
        ],
      }
    } else if (path.endsWith("/conversations")) {
      json = { data: [conversation] }
    } else if (path.endsWith("/conversations/conversation")) {
      if (route.request().method() === "PATCH") {
        expect(route.request().postDataJSON()).toEqual({
          ai_handler: "human",
        })
        takenOver = true
      }
      json = {
        data: {
          ...conversation,
          ai_handler: takenOver ? "human" : "ai-active",
        },
      }
    } else if (path.endsWith("/inboxes")) {
      json = { data: [conversation.inbox] }
    } else if (path.endsWith("/members")) {
      json = {
        data: [
          {
            id: 2,
            name: "Human teammate",
            email: "human@example.test",
            avatar_url: null,
            is_owner: false,
          },
        ],
      }
    } else if (path.endsWith("/agents")) {
      json = {
        data: [
          {
            id: "support-agent",
            name: "Customer support",
            status: "active",
            isPrimary: true,
          },
        ],
      }
    } else if (path.endsWith("/ai-settings")) {
      settingsReads++
      if (route.request().method() === "PUT") {
        settings = route.request().postDataJSON()
        saved = true
      }
      json = { data: settings }
    } else if (path === "/api/v1/ai/models") {
      json = {
        chatModels: [
          {
            id: "provider/support",
            label: "Support Model",
            provider: "provider",
          },
        ],
        embeddingProviders: [],
      }
    } else if (path.endsWith("/contacts/contact")) {
      json = {
        data: {
          display_name: "Assignment Test Customer",
          addresses: [],
          conversations: [],
          merged_contacts: [],
        },
      }
    }
    await route.fulfill({ json })
  })
  await page.goto(`${dashboardUrl}/settings?tab=assignments`)
  await expect(
    page.getByRole("switch", { name: "Enable Manion AI" })
  ).toBeVisible()
  await page.getByRole("switch", { name: "Enable Manion AI" }).click()
  await page.getByRole("combobox", { name: "Primary agent" }).click()
  await page
    .getByRole("option", { name: "Customer support", exact: true })
    .click()
  await page.getByRole("combobox", { name: "Default model" }).click()
  await page.getByRole("option", { name: "Support Model", exact: true }).click()
  expect(saved).toBe(false)
  await page.getByRole("button", { name: "Save", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Save", exact: true })
  ).toBeDisabled()
  expect(settings).toMatchObject({
    auto_assign: true,
    auto_reply: true,
    primary_agent_id: "support-agent",
    default_model: "provider/support",
    follow_up_enabled: true,
  })
  await page.screenshot({
    path: `/tmp/dacoo-workspace-settings-${testInfo.project.name}.png`,
    animations: "disabled",
  })
  await page.goto(`${dashboardUrl}/inbox`)
  await page.getByRole("button", { name: /Assignment Test Customer/ }).click()
  await page.getByRole("button", { name: "Take over", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Take over", exact: true })
  ).toHaveCount(0)
  expect(takenOver).toBe(true)
  await page.getByRole("button", { name: "More conversation options" }).click()
  await expect(
    page.getByRole("menuitem", { name: "Assign to AI" })
  ).toHaveCount(0)
  await page.getByRole("menuitem", { name: "Assign team member" }).click()
  const memberDialog = page.getByRole("dialog", { name: "Assign conversation" })
  await expect(memberDialog).toBeVisible()
  await expect(
    memberDialog.getByText("Human teammate", { exact: true })
  ).toBeVisible()
  await expect(
    memberDialog.getByText("Customer support", { exact: true })
  ).toHaveCount(0)
  await expect(
    memberDialog.getByText("Activate Manion", { exact: true })
  ).toHaveCount(0)
  expect(settingsReads).toBeGreaterThanOrEqual(2)
  const bounds = await memberDialog.boundingBox()
  expect(bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width - 16)
  await page.screenshot({
    path: `/tmp/dacoo-human-assignment-${testInfo.project.name}.png`,
    animations: "disabled",
  })
  await memberDialog.getByRole("button", { name: "Close", exact: true }).click()
  takenOver = false
  await page.goto(`${dashboardUrl}/settings?tab=assignments`)
  await page.getByRole("switch", { name: "Enable Manion AI" }).click()
  await page.getByRole("button", { name: "Save", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Save", exact: true })
  ).toBeDisabled()
  expect(settings.auto_assign).toBe(false)
  expect(settings.auto_reply).toBe(false)
  await page.goto(`${dashboardUrl}/inbox`)
  await page.getByRole("button", { name: /Assignment Test Customer/ }).click()
  await expect(
    page.getByRole("button", { name: "Take over", exact: true })
  ).toHaveCount(0)
  await expect(
    page.getByText("Manion is responding…", { exact: true })
  ).toHaveCount(0)
})
