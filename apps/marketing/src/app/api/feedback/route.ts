import { sendTelegramMessage } from "@/lib/telegram"

type FeedbackPayload = {
  category?: unknown
  rating?: unknown
  message?: unknown
  email?: unknown
}

const CATEGORIES = new Set(["Bug report", "Feature request", "General feedback", "Other"])
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export async function POST(request: Request) {
  let payload: FeedbackPayload

  try {
    payload = (await request.json()) as FeedbackPayload
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 })
  }

  const category = text(payload.category)
  const ratingText = text(payload.rating)
  const message = text(payload.message)
  const email = text(payload.email).toLowerCase()
  const rating = ratingText ? Number(ratingText) : null

  if (!CATEGORIES.has(category)) {
    return Response.json({ error: "Please select a valid feedback type." }, { status: 400 })
  }

  if (
    rating !== null &&
    (!Number.isInteger(rating) || rating < 1 || rating > 5 || String(rating) !== ratingText)
  ) {
    return Response.json({ error: "Please select a valid rating." }, { status: 400 })
  }

  if (message.length < 10 || message.length > 5000) {
    return Response.json({ error: "Feedback must be between 10 and 5,000 characters." }, { status: 400 })
  }

  if (email && (!EMAIL_RE.test(email) || email.length > 254)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 })
  }

  const telegramMessage = [
    "New feedback submission",
    `Category: ${category}`,
    `Rating: ${rating ?? "—"}`,
    `Email: ${email || "—"}`,
    "",
    message.length > 3000 ? `${message.slice(0, 3000)}…` : message,
  ].join("\n")

  if (!(await sendTelegramMessage(telegramMessage))) {
    return Response.json({ error: "We couldn't send your feedback. Please try again." }, { status: 500 })
  }

  return Response.json({ ok: true })
}
