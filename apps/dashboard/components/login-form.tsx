"use client"

import React, { useState } from "react"
import { EyeIcon, EyeOffIcon, LockKeyholeIcon } from "@/components/ui/icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { ApiError } from "@/lib/api"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

export function LoginForm({
  nextPath,
  className,
  ...props
}: React.ComponentProps<"form"> & { nextPath?: string | null }) {
  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    setFieldErrors({})

    try {
      await login(email, password, nextPath)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 422 && err.errors) {
          setFieldErrors(err.errors)
        } else {
          setError(err.message)
        }
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-7", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col gap-2">
          <span className="flex size-10 items-center justify-center rounded-xl border bg-muted/50 text-foreground shadow-sm">
            <LockKeyholeIcon className="size-4.5" />
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Sign in to continue to your Dacoo workspace.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-lg border border-destructive/20 bg-destructive/8 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <Field data-invalid={!!fieldErrors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={isLoading}
            aria-invalid={!!fieldErrors.email}
          />
          {fieldErrors.email && <FieldError>{fieldErrors.email[0]}</FieldError>}
        </Field>

        <Field data-invalid={!!fieldErrors.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={isLoading}
              aria-invalid={!!fieldErrors.password}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              disabled={isLoading}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {showPassword ? (
                <EyeOffIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <FieldError>{fieldErrors.password[0]}</FieldError>
          )}
        </Field>

        <Field>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Spinner />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
