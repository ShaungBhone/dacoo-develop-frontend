import { sendTelegramMessage } from "@/lib/telegram"

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

  const telegramMessage = [
    "New contact request",
    `Name: ${name}`,
    `Company: ${company || "—"}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Team size: ${teamSize}`,
    `Industry: ${industry || "—"}`,
    `Plan: ${plan || "—"}`,
    `Referral code: ${referralCode || "—"}`,
    "",
    message.length > 3000 ? `${message.slice(0, 3000)}…` : message,
  ].join("\n")

  if (!(await sendTelegramMessage(telegramMessage))) {
    return Response.json({ error: "We couldn't send your request. Please try again." }, { status: 500 })
  }

  return Response.json({ ok: true })
}
