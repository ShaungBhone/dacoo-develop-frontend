import "server-only"

export async function sendTelegramMessage(text: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.error("Telegram environment variables are not configured")
    return false
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    })

    if (!response.ok) {
      const responseBody = await response.text()

      console.error("Failed to send Telegram message", response.status, responseBody)
      return false
    }

    return true
  } catch (error) {
    console.error("Failed to send Telegram message", error)
    return false
  }
}
