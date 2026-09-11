"use client"

import { useSearchParams } from "next/navigation"
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

const TEAM_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"]

const INDUSTRIES = [
  "Retail & E-commerce",
  "Food & Beverage",
  "Healthcare",
  "Education",
  "Real Estate",
  "Finance & Banking",
  "Travel & Tourism",
  "Beauty & Wellness",
  "Logistics & Delivery",
  "Technology",
  "Manufacturing",
  "Media & Entertainment",
  "Automotive",
  "Government & NGO",
  "Other",
]

type Status = "idle" | "submitting" | "success" | "error"

export function ContactForm() {
  // Carry the plan chosen on the pricing page (?plan=) and any partner
  // referral code (?ref=) through to the submission.
  const searchParams = useSearchParams()
  const plan = searchParams.get("plan") ?? ""

  const [status, setStatus] = useState<Status>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [teamSize, setTeamSize] = useState<string | null>(null)
  const [industry, setIndustry] = useState<string | null>(null)
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") ?? "")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    if (!form.reportValidity()) return

    setStatus("submitting")
    setErrorMessage(null)

    try {
      const payload = Object.fromEntries(new FormData(form).entries())
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? "We couldn't send your request. Please try again.")
      }

      form.reset()
      setTeamSize(null)
      setIndustry(null)
      setReferralCode("")
      setStatus("success")
    } catch (error) {
      setStatus("error")
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't send your request. Please try again."
      )
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <input type="hidden" name="plan" value={plan} />

      <Field id="name" label="Full name" required>
        <Input id="name" name="name" placeholder="John Doe" autoComplete="name" maxLength={120} required />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="company" label="Company" required>
          <Input id="company" name="company" placeholder="Company name" autoComplete="organization" maxLength={160} required />
        </Field>
        <Field id="email" label="Professional email" required>
          <Input id="email" name="email" placeholder="name@company.com" type="email" autoComplete="email" maxLength={254} required />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="phone" label="Phone" required>
          <Input id="phone" name="phone" placeholder="+1 555 000 0000" type="tel" autoComplete="tel" maxLength={40} required />
        </Field>
        <Field id="teamSize" label="Team size" required>
          <Select
            id="teamSize"
            name="teamSize"
            value={teamSize}
            onValueChange={setTeamSize}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select team size" />
            </SelectTrigger>
            <SelectContent>
              {TEAM_SIZES.map((size) => <SelectItem key={size} value={size}>{size}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field id="industry" label="Industry" required>
        <Select
          id="industry"
          name="industry"
          value={industry}
          onValueChange={setIndustry}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select industry" />
          </SelectTrigger>
          <SelectContent>
            {INDUSTRIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      <Field id="referralCode" label="Referral code" hint="Optional">
        <Input
          id="referralCode"
          name="referralCode"
          placeholder="Enter your partner's code"
          autoComplete="off"
          maxLength={60}
          value={referralCode}
          onChange={(event) => setReferralCode(event.target.value)}
        />
      </Field>

      <Field id="message" label="Message" required>
        <Textarea
          id="message"
          name="message"
          className="min-h-32 resize-y"
          placeholder="Tell us about the conversations you want Dacoo to manage..."
          minLength={10}
          maxLength={5000}
          required
        />
      </Field>

      <div className="flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xs text-sm leading-5 text-muted-foreground">
          By submitting this form, you agree to our <a className="text-primary underline underline-offset-4" href="/privacy">Privacy Policy</a>.
        </p>
        <Button type="submit" className="sm:self-end" disabled={status === "submitting"}>
          {status === "submitting" ? "Sending..." : "Get in touch"}
        </Button>
      </div>

      {status === "success" && (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Thanks for reaching out. Our team will be in touch shortly.
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
  hint,
  children,
}: {
  id: string
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}{required && <span className="text-destructive"> *</span>}
        {hint && <span className="ml-1 font-normal text-muted-foreground">({hint})</span>}
      </label>
      {children}
    </div>
  )
}
