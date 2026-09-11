import { neon } from "@neondatabase/serverless"

type ContactPayload = {
  name?: unknown
  company?: unknown
  email?: unknown
  phone?: unknown
  teamSize?: unknown
  industry?: unknown
  message?: unknown
  plan?: unknown
  referralCode?: unknown
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const TEAM_SIZES = new Set(["1-10", "11-50", "51-200", "201-500", "500+"])

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

async function notifyTelegram(payload: {
  name: string
  company: string
  email: string
  phone: string
  teamSize: string
  industry: string
  message: string
  plan: string
  referralCode: string
}) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    return
  }

  const message = payload.message.length > 3000 ? `${payload.message.slice(0, 3000)}…` : payload.message
  const text = [
    "New contact request",
    `Name: ${payload.name}`,
    `Company: ${payload.company || "—"}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone}`,
    `Team size: ${payload.teamSize}`,
    `Industry: ${payload.industry || "—"}`,
    `Plan: ${payload.plan || "—"}`,
    `Referral code: ${payload.referralCode || "—"}`,
    "",
    message,
  ].join("\n")

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    })

    if (!response.ok) {
      console.error("Failed to send Telegram contact notification", response.status)
    }
  } catch (error) {
    console.error("Failed to send Telegram contact notification", error)
  }
}

export async function POST(request: Request) {
  let payload: ContactPayload

  try {
    payload = (await request.json()) as ContactPayload
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 })
  }

  const name = text(payload.name)
  const company = text(payload.company)
  const email = text(payload.email).toLowerCase()
  const phone = text(payload.phone)
  const teamSize = text(payload.teamSize)
  const industry = text(payload.industry)
  const message = text(payload.message)
  const plan = text(payload.plan)
  const referralCode = text(payload.referralCode)

  if (!name || !company || !email || !phone || !teamSize || !industry || !message) {
    return Response.json({ error: "Please complete all required fields." }, { status: 400 })
  }

  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 })
  }

  if (!TEAM_SIZES.has(teamSize)) {
    return Response.json({ error: "Please select a valid team size." }, { status: 400 })
  }

  if (
    name.length > 120 ||
    company.length > 160 ||
    email.length > 254 ||
    phone.length > 40 ||
    industry.length > 120 ||
    message.length < 10 ||
    message.length > 5000 ||
    plan.length > 80 ||
    referralCode.length > 60
  ) {
    return Response.json({ error: "One or more fields are invalid." }, { status: 400 })
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error("DATABASE_URL is not configured")
    return Response.json({ error: "Contact form is temporarily unavailable." }, { status: 500 })
  }

  try {
    const sql = neon(databaseUrl)
    await sql`
      INSERT INTO contact_submissions (
        name,
        company,
        email,
        phone,
        team_size,
        industry,
        message,
        plan,
        referral_code
      ) VALUES (
        ${name},
        ${company},
        ${email},
        ${phone},
        ${teamSize},
        ${industry},
        ${message},
        ${plan || null},
        ${referralCode || null}
      )
    `
  } catch (error) {
    console.error("Failed to save contact submission", error)
    return Response.json({ error: "We couldn't send your request. Please try again." }, { status: 500 })
  }

  await notifyTelegram({ name, company, email, phone, teamSize, industry, message, plan, referralCode })

  return Response.json({ ok: true })
}
