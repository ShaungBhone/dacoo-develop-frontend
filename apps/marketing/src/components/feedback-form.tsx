"use client"

import { type FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const CATEGORIES = ["Bug report", "Feature request", "General feedback", "Other"]
const RATINGS = [1, 2, 3, 4, 5]

type Status = "idle" | "submitting" | "success" | "error"

export function FeedbackForm() {
  const [status, setStatus] = useState<Status>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [rating, setRating] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    if (!form.reportValidity()) return

    setStatus("submitting")
    setErrorMessage(null)

    try {
      const payload = Object.fromEntries(new FormData(form).entries())
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? "We couldn't send your feedback. Please try again.")
      }

      form.reset()
      setCategory(null)
      setRating(null)
      setStatus("success")
    } catch (error) {
      setStatus("error")
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't send your feedback. Please try again."
      )
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <Field id="category" label="Feedback type" required>
        <Select id="category" name="category" value={category} onValueChange={setCategory} required>
          <SelectTrigger>
            <SelectValue placeholder="Select feedback type" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      <Field id="rating" label="How would you rate your experience?">
        <Select id="rating" name="rating" value={rating} onValueChange={setRating}>
          <SelectTrigger>
            <SelectValue placeholder="Optional" />
          </SelectTrigger>
          <SelectContent>
            {RATINGS.map((value) => <SelectItem key={value} value={String(value)}>{value} out of 5</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      <Field id="message" label="Your feedback" required>
        <Textarea
          id="message"
          name="message"
          className="min-h-36 resize-y"
          placeholder="Tell us what is working well or what we could improve..."
          minLength={10}
          maxLength={5000}
          required
        />
      </Field>

      <Field id="email" label="Email for follow-up">
        <Input
          id="email"
          name="email"
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          maxLength={254}
        />
      </Field>

      <div className="flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xs text-sm leading-5 text-muted-foreground">
          You can submit feedback anonymously. We&apos;ll only use your email to follow up about this feedback.
        </p>
        <Button type="submit" className="sm:self-end" disabled={status === "submitting"}>
          {status === "submitting" ? "Sending..." : "Send feedback"}
        </Button>
      </div>

      {status === "success" && (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Thanks for your feedback. It helps us improve Dacoo.
        </p>
      )}
      {status === "error" && errorMessage && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {errorMessage}
        </p>
      )}
    </form>
  )
}

function Field({
  id,
  label,
  required = false,
  children,
}: {
  id: string
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}{required && <span className="text-destructive"> *</span>}
      </label>
      {children}
    </div>
  )
}
