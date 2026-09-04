import { getCookie } from "./cookies"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://maychat.test"
const isDev = process.env.NODE_ENV !== "production"

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]>
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.errors = errors
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: Omit<RequestInit, "body"> & { body?: any } = {}
): Promise<T> {
  const token = getCookie("auth_token")

  const headers = new Headers(options.headers)
  headers.set("Accept", "application/json")

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const isJson =
    options.body &&
    typeof options.body === "object" &&
    !(options.body instanceof FormData)
  if (isJson) {
    headers.set("Content-Type", "application/json")
  }

  const config: RequestInit = {
    ...options,
    headers,
  }

  if (isJson) {
    config.body = JSON.stringify(options.body)
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config)

  if (response.status === 204) {
    return null as unknown as T
  }

  let data
  const contentType = response.headers.get("content-type")
  if (contentType && contentType.includes("application/json")) {
    data = await response.json()
  } else {
    data = await response.text()
  }

  if (!response.ok) {
    const isProd = process.env.NODE_ENV === "production"
    let message: string
    if (isProd) {
      message =
        extractCleanMessage(data) ?? friendlyStatusMessage(response.status)
    } else {
      if (isDev)
        console.error("[apiFetch] non-ok response:", {
          status: response.status,
          data,
        })
      message = devErrorMessage(response.status, data)
    }
    throw new ApiError(message, response.status, data?.errors)
  }

  return data as T
}

/**
 * Fetch a binary response (e.g. a PDF) and trigger a browser download,
 * since <a href> can't carry the Bearer auth header these endpoints require.
 */
export async function apiDownload(
  endpoint: string,
  filename: string
): Promise<void> {
  const token = getCookie("auth_token")
  const headers = new Headers()
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const response = await fetch(`${BASE_URL}${endpoint}`, { headers })

  if (!response.ok) {
    throw new ApiError(friendlyStatusMessage(response.status), response.status)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function extractCleanMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined
  const obj = data as Record<string, unknown>
  const errorObj = obj.error
  const candidate =
    (typeof errorObj === "object" && errorObj !== null
      ? (errorObj as Record<string, unknown>).message
      : typeof errorObj === "string"
        ? errorObj
        : undefined) ?? obj.message
  if (typeof candidate !== "string") return undefined
  if (process.env.NODE_ENV === "production") {
    if (/HTTP request returned status code/.test(candidate)) return undefined
    if (candidate.trim().startsWith("{")) return undefined
  }
  return candidate
}

function devErrorMessage(status: number, data: unknown): string {
  const clean = extractCleanMessage(data)
  if (clean) return `[${status}] ${clean}`
  const snapshot =
    typeof data === "string"
      ? data
      : (() => {
          try {
            return JSON.stringify(data)
          } catch {
            return String(data)
          }
        })()
  const trimmed = snapshot.trim()
  if (trimmed) return `[${status}] ${trimmed.slice(0, 500)}`
  return `[${status}] ${friendlyStatusMessage(status)}`
}

function friendlyStatusMessage(status: number): string {
  switch (status) {
    case 401:
      return "You're not authorized to do that. Please sign in again."
    case 403:
      return "You don't have permission to do that."
    case 404:
      return "We couldn't find what you were looking for."
    case 422:
      return "Some of the information provided wasn't valid."
    case 429:
      return "Too many requests. Please wait a moment and try again."
    case 500:
    case 502:
    case 503:
    case 504:
      return "Something went wrong on our end. Please try again."
    default:
      return "Request failed. Please try again."
  }
}
