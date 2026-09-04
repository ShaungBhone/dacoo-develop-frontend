"use client"

import * as React from "react"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronLeftIcon,
  CircleDollarSignIcon,
  UploadCloudIcon,
  XIcon,
} from "@/components/ui/icons"

import {
  createCardOrder,
  createCardPurpose,
  fetchCardOrderCatalog,
  type CardDesign,
  type CardOrder,
  type CardOrderCatalog,
  type CardPaymentMethod,
  type CardPurpose,
} from "@/components/card-order-api"
import { AppLogo } from "@/components/app-logo"
import { PaymentCardPreview } from "@/components/payment-card"
import {
  fetchCurrencies,
  SUPPORTED_CURRENCY_CODES,
  type Currency,
} from "@/components/settings/currency-api"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { TypographyH2, TypographyMuted } from "@/components/ui/typography"
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"

type Step = "card" | "purpose" | "balance" | "payment" | "verification"

const PREMIUM_STEPS: { id: Step; label: string }[] = [
  { id: "card", label: "Card" },
  { id: "purpose", label: "Purpose" },
  { id: "balance", label: "Balance" },
  { id: "payment", label: "Payment" },
  { id: "verification", label: "Verification" },
]

const MIN_INITIAL_BALANCE = 10
const MAX_INITIAL_BALANCE = 10_000_000
function formatPrice(design: CardDesign): string {
  if (design.tier === "standard" || design.price.amount === 0) return "Free"
  return `${design.price.amount.toLocaleString()} ${design.price.currency}`
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">
      <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
      <p>{message}</p>
    </div>
  )
}

function StepperHeader({
  current,
  steps,
  onClose,
}: {
  current: Step
  steps: { id: Step; label: string }[]
  onClose: () => void
}) {
  const definitions = React.useMemo(
    () => steps.map((step) => ({ id: step.id, title: step.label })),
    [steps]
  )

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center border-b border-border bg-background px-4 py-4 sm:px-6">
      <div className="flex justify-start">
        <AppLogo />
      </div>
      <div className="flex w-full justify-center">
        <Stepper
          steps={definitions}
          value={current}
          indicators={{
            completed: (
              <CheckIcon
                className="size-3.5 text-primary-foreground"
                strokeWidth={3}
              />
            ),
          }}
          className="flex w-auto items-center justify-center"
        >
          <StepperNav className="flex items-center gap-0">
            {definitions.map((step, index) => (
              <StepperItem
                key={step.id}
                stepId={step.id}
                disabled
                className="flex items-center"
              >
                <StepperTrigger className="pointer-events-none cursor-default gap-2 px-1">
                  <StepperIndicator className="size-6 rounded-full text-xs font-semibold">
                    {index + 1}
                  </StepperIndicator>
                  <StepperTitle className="hidden text-xs font-medium whitespace-nowrap lg:block">
                    {step.title}
                  </StepperTitle>
                </StepperTrigger>
                {index < definitions.length - 1 && (
                  <StepperSeparator className="mx-1 h-px w-4 bg-muted transition-colors duration-300 group-data-[state=completed]/step:bg-primary sm:mx-2 sm:w-6 lg:w-10" />
                )}
              </StepperItem>
            ))}
          </StepperNav>
        </Stepper>
      </div>
      <div className="flex justify-end">
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          aria-label="Close"
        >
          <XIcon data-icon="inline-start" />
        </Button>
      </div>
    </div>
  )
}

function SelectableCard({
  design,
  selected,
}: {
  design: CardDesign
  selected: boolean
}) {
  return (
    <ToggleGroupItem
      value={design.id}
      aria-label={`Select ${design.name}`}
      className={cn(
        "h-auto w-fit flex-col items-start gap-2 rounded-2xl p-2 text-left whitespace-normal",
        selected
          ? "bg-primary/5 ring-2 ring-primary"
          : "ring-1 ring-border hover:ring-primary/40"
      )}
    >
      <PaymentCardPreview theme={design.theme} title={design.name} />
      <span className="flex w-full items-center justify-between gap-3 px-1 pb-0.5">
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-foreground">
            {design.name}
          </span>
          <span className="block text-xs text-muted-foreground">
            {formatPrice(design)}
          </span>
        </span>
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
            selected
              ? "border-primary bg-primary"
              : "border-muted-foreground/40"
          )}
        >
          {selected && (
            <CheckIcon
              className="size-3 text-primary-foreground"
              strokeWidth={3}
            />
          )}
        </span>
      </span>
    </ToggleGroupItem>
  )
}

function CardStep({
  catalog,
  selected,
  onSelect,
  onContinue,
  onCancel,
}: {
  catalog: CardOrderCatalog
  selected: CardDesign | null
  onSelect: (design: CardDesign) => void
  onContinue: () => void
  onCancel: () => void
}) {
  const standard = catalog.designs.filter(
    (design) => design.tier === "standard"
  )
  const premium = catalog.designs.filter((design) => design.tier === "premium")

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <TypographyH2 className="text-xl font-bold">
          Choose your card
        </TypographyH2>
        <TypographyMuted className="mt-1">
          Standard cards are free. Premium cards are priced by design.
        </TypographyMuted>
      </div>

      {standard.length > 0 && (
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Standard cards
            </p>
            <p className="text-xs text-muted-foreground">No card fee</p>
          </div>
          <ToggleGroup
            type="single"
            value={selected?.tier === "standard" ? selected.id : ""}
            onValueChange={(value) => {
              const design = standard.find((item) => item.id === value)
              if (design) onSelect(design)
            }}
            className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {standard.map((design) => (
              <SelectableCard
                key={design.id}
                design={design}
                selected={selected?.id === design.id}
              />
            ))}
          </ToggleGroup>
        </div>
      )}

      {premium.length > 0 && (
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Premium cards
            </p>
            <p className="text-xs text-muted-foreground">
              Premium finish with a one-time card fee
            </p>
          </div>
          <ToggleGroup
            type="single"
            value={selected?.tier === "premium" ? selected.id : ""}
            onValueChange={(value) => {
              const design = premium.find((item) => item.id === value)
              if (design) onSelect(design)
            }}
            className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {premium.map((design) => (
              <SelectableCard
                key={design.id}
                design={design}
                selected={selected?.id === design.id}
              />
            ))}
          </ToggleGroup>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-2">
        <Button
          onClick={onContinue}
          disabled={!selected}
          size="lg"
          className="w-full"
        >
          Continue
        </Button>
        <Button onClick={onCancel} variant="ghost" size="lg" className="w-full">
          <XIcon data-icon="inline-start" />
          Cancel
        </Button>
      </div>
    </div>
  )
}

function PurposeStep({
  purposes,
  selected,
  onSelect,
  onContinue,
  onBack,
  isSubmitting,
}: {
  purposes: CardPurpose[]
  selected: CardPurpose | null
  onSelect: (purpose: CardPurpose) => void
  onContinue: (customData?: {
    isCustom: boolean
    name: string
    description: string
  }) => void
  onBack: () => void
  isSubmitting: boolean
}) {
  const [customName, setCustomName] = React.useState("")
  const [customDescription, setCustomDescription] = React.useState("")

  const displayPurposes = React.useMemo(() => {
    return [
      ...purposes,
      {
        id: "custom",
        name: "Other (Custom)",
        slug: "custom",
        description: "Define a custom purpose for your card",
      },
    ]
  }, [purposes])

  const handleContinue = () => {
    if (selected?.id === "custom") {
      if (!customName.trim()) return
      onContinue({
        isCustom: true,
        name: customName.trim(),
        description: customDescription.trim(),
      })
    } else {
      onContinue()
    }
  }

  const isContinueDisabled =
    !selected ||
    isSubmitting ||
    (selected.id === "custom" && !customName.trim())

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <TypographyH2 className="text-xl font-bold">
          What&apos;s your purpose?
        </TypographyH2>
        <TypographyMuted className="mt-1">
          Tell us how you plan to use this card
        </TypographyMuted>
      </div>
      <ToggleGroup
        type="single"
        value={selected?.id ?? ""}
        onValueChange={(value) => {
          const purpose = displayPurposes.find((item) => item.id === value)
          if (purpose) onSelect(purpose)
        }}
        className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2"
      >
        {displayPurposes.map((purpose) => (
          <ToggleGroupItem
            key={purpose.id}
            value={purpose.id}
            aria-label={`Select ${purpose.name}`}
            className={cn(
              "h-auto flex-col items-start rounded-xl border px-4 py-3.5 text-left whitespace-normal",
              selected?.id === purpose.id
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border bg-background hover:border-muted-foreground/40"
            )}
          >
            <p className="text-sm font-semibold text-foreground">
              {purpose.name}
            </p>
            {purpose.description && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {purpose.description}
              </p>
            )}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {purposes.length === 0 && (
        <ErrorMessage message="No card purposes are available. Ask an administrator to configure one." />
      )}

      {selected?.id === "custom" && (
        <div className="flex animate-in flex-col gap-4 rounded-xl border border-dashed border-border bg-muted/5 p-4 duration-200 fade-in-50">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="custom-purpose-name">Purpose Name</Label>
            <Input
              id="custom-purpose-name"
              placeholder="e.g. Marketing Expenses"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="custom-purpose-desc">Description (Optional)</Label>
            <Input
              id="custom-purpose-desc"
              placeholder="e.g. Used for Google & Facebook ads"
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-2">
        <Button
          onClick={handleContinue}
          disabled={isContinueDisabled}
          size="lg"
          className="w-full"
        >
          {isSubmitting ? <Spinner /> : "Continue"}
        </Button>
        <Button
          onClick={onBack}
          disabled={isSubmitting}
          variant="ghost"
          size="lg"
          className="w-full"
        >
          <ChevronLeftIcon data-icon="inline-start" />
          Go back
        </Button>
      </div>
    </div>
  )
}

function BalanceStep({
  selectedCurrencyCode,
  initialBalance,
  onSelect,
  onInitialBalanceChange,
  onContinue,
  onBack,
}: {
  selectedCurrencyCode: string | null
  initialBalance: string
  onSelect: (currencyCode: string) => void
  onInitialBalanceChange: (value: string) => void
  onContinue: () => void
  onBack: () => void
}) {
  const [currencies, setCurrencies] = React.useState<Currency[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const currencyRadioGroupId = React.useId()

  const loadCurrencies = React.useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      setCurrencies(await fetchCurrencies())
    } catch (error) {
      setLoadError(
        error instanceof ApiError
          ? error.message
          : "Failed to load available currencies."
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const result = await fetchCurrencies()
        if (!cancelled) setCurrencies(result)
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof ApiError
              ? error.message
              : "Failed to load available currencies."
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [])

  const supportedCurrencies = React.useMemo(
    () =>
      currencies.filter((currency) =>
        SUPPORTED_CURRENCY_CODES.has(currency.code)
      ),
    [currencies]
  )
  const parsedBalance = initialBalance === "" ? 0 : Number(initialBalance)
  const balanceIsValid =
    Number.isInteger(parsedBalance) &&
    (parsedBalance === 0 ||
      (parsedBalance >= MIN_INITIAL_BALANCE &&
        parsedBalance <= MAX_INITIAL_BALANCE))
  const balanceError = !balanceIsValid
    ? `Enter 0 or an amount from ${MIN_INITIAL_BALANCE.toLocaleString()} to ${MAX_INITIAL_BALANCE.toLocaleString()}.`
    : null

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <TypographyH2 className="text-xl font-bold">
          Open a balance
        </TypographyH2>
        <TypographyMuted className="mt-1">
          Choose the currency this card will use to send, receive, and spend.
        </TypographyMuted>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2" aria-label="Loading currencies">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : loadError ? (
        <Empty className="min-h-48 p-6">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CircleDollarSignIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>Couldn&apos;t load currencies</EmptyTitle>
            <EmptyDescription>{loadError}</EmptyDescription>
          </EmptyHeader>
          <Button type="button" variant="outline" onClick={loadCurrencies}>
            Try again
          </Button>
        </Empty>
      ) : supportedCurrencies.length === 0 ? (
        <Empty className="min-h-48 p-6">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CircleDollarSignIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No supported currencies available</EmptyTitle>
            <EmptyDescription>
              No ASEAN or US dollar currencies are currently available.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <RadioGroup
          value={selectedCurrencyCode ?? ""}
          onValueChange={onSelect}
          aria-label="Choose a balance currency"
          className="gap-2"
        >
          {supportedCurrencies.map((currency) => (
            <div
              key={currency.code}
              className="relative flex min-h-14 w-full items-center gap-3 rounded-xl border border-input bg-background px-3 py-2 shadow-xs transition-colors outline-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 hover:border-muted-foreground/40 has-data-checked:border-primary/50 has-data-checked:bg-primary/5"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <CircleDollarSignIcon className="size-4" aria-hidden="true" />
              </span>
              <div className="grid min-w-0 grow gap-0.5">
                <Label
                  htmlFor={`${currencyRadioGroupId}-${currency.code}`}
                  className="after:absolute after:inset-0"
                >
                  {currency.code}
                </Label>
                <p
                  id={`${currencyRadioGroupId}-${currency.code}-description`}
                  className="truncate text-sm text-muted-foreground"
                >
                  {currency.name}
                </p>
              </div>
              <RadioGroupItem
                value={currency.code}
                id={`${currencyRadioGroupId}-${currency.code}`}
                aria-describedby={`${currencyRadioGroupId}-${currency.code}-description`}
                className="ml-auto size-5 [&_[data-slot=radio-group-indicator]>span]:size-2.5"
              />
            </div>
          ))}
        </RadioGroup>
      )}

      <FieldGroup>
        <Field data-invalid={balanceError ? true : undefined}>
          <FieldLabel htmlFor="initial-card-balance">
            Initial balance (optional)
          </FieldLabel>
          <Input
            id="initial-card-balance"
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_INITIAL_BALANCE}
            step="10"
            placeholder="0"
            value={initialBalance}
            onChange={(event) => onInitialBalanceChange(event.target.value)}
            aria-invalid={balanceError ? true : undefined}
          />
          <FieldDescription>
            Add money now, or leave it at 0. Maximum{" "}
            {MAX_INITIAL_BALANCE.toLocaleString()}
            {selectedCurrencyCode ? ` ${selectedCurrencyCode}` : ""}.
          </FieldDescription>
          {balanceError && <FieldError>{balanceError}</FieldError>}
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-3 pt-2">
        <Button
          onClick={onContinue}
          disabled={
            !selectedCurrencyCode || !balanceIsValid || isLoading || !!loadError
          }
          size="lg"
          className="w-full"
        >
          Continue
        </Button>
        <Button onClick={onBack} variant="ghost" size="lg" className="w-full">
          <ChevronLeftIcon data-icon="inline-start" />
          Go back
        </Button>
      </div>
    </div>
  )
}

function PaymentStep({
  design,
  methods,
  selected,
  initialBalanceAmount,
  onSelect,
  onContinue,
  onBack,
}: {
  design: CardDesign
  methods: CardPaymentMethod[]
  selected: CardPaymentMethod | null
  initialBalanceAmount: number
  onSelect: (method: CardPaymentMethod) => void
  onContinue: () => void
  onBack: () => void
}) {
  const totalAmount = design.price.amount + initialBalanceAmount
  const needsPayment = totalAmount > 0

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <TypographyH2 className="text-xl font-bold">
          How would you like to pay?
        </TypographyH2>
        <TypographyMuted className="mt-1">
          Choose a payment method for the card and initial balance
        </TypographyMuted>
      </div>
      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Card fee</span>
            <span className="font-mono font-medium text-foreground">
              {formatPrice(design)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Initial balance</span>
            <span className="font-mono font-medium text-foreground">
              {initialBalanceAmount.toLocaleString()} {design.price.currency}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
            <span className="font-semibold text-foreground">Total to pay</span>
            <span className="font-mono font-semibold text-foreground">
              {totalAmount.toLocaleString()} {design.price.currency}
            </span>
          </div>
        </div>
      </div>
      {needsPayment && (
        <>
          <ToggleGroup
            type="single"
            value={selected?.id ?? ""}
            onValueChange={(value) => {
              const method = methods.find((item) => item.id === value)
              if (method) onSelect(method)
            }}
            className="grid w-full grid-cols-2 gap-2"
          >
            {methods.map((method) => (
              <ToggleGroupItem
                key={method.id}
                value={method.id}
                aria-label={`Select ${method.name}`}
                className={cn(
                  "relative h-auto flex-col items-center justify-center gap-2 rounded-xl border p-4",
                  selected?.id === method.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-muted-foreground/40"
                )}
              >
                {selected?.id === method.id && (
                  <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary">
                    <CheckIcon
                      className="size-3 text-primary-foreground"
                      strokeWidth={3}
                    />
                  </span>
                )}
                {method.logo_url ? (
                  // The API controls the media host, so this cannot use a fixed Next.js image allowlist.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={method.logo_url}
                    alt=""
                    className="size-9 object-contain"
                  />
                ) : (
                  <span
                    className="flex size-9 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: method.brand_color }}
                  >
                    {method.name.charAt(0)}
                  </span>
                )}
                <span className="text-xs font-semibold text-foreground">
                  {method.name}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {methods.length === 0 && (
            <ErrorMessage message="No card payment methods are available." />
          )}
        </>
      )}
      <div className="flex flex-col gap-3 pt-2">
        <Button
          onClick={onContinue}
          disabled={needsPayment && !selected}
          size="lg"
          className="w-full"
        >
          Continue
        </Button>
        <Button onClick={onBack} variant="ghost" size="lg" className="w-full">
          <ChevronLeftIcon data-icon="inline-start" />
          Go back
        </Button>
      </div>
    </div>
  )
}

function VerificationStep({
  design,
  method,
  initialBalanceAmount,
  proofFile,
  onFileChange,
  onContinue,
  onBack,
  isSubmitting,
}: {
  design: CardDesign
  method: CardPaymentMethod
  initialBalanceAmount: number
  proofFile: File | null
  onFileChange: (file: File | null) => void
  onContinue: () => void
  onBack: () => void
  isSubmitting: boolean
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = React.useState(false)
  const totalAmount = design.price.amount + initialBalanceAmount
  function acceptFile(file: File | undefined) {
    if (file) onFileChange(file)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <TypographyH2 className="text-xl font-bold">
          Scan &amp; pay
        </TypographyH2>
        <TypographyMuted className="mt-1">
          Pay{" "}
          <span className="font-mono font-semibold text-foreground">
            {totalAmount.toLocaleString()} {design.price.currency}
          </span>{" "}
          with {method.name}
        </TypographyMuted>
      </div>
      <div className="flex flex-col items-center gap-3">
        {method.qr_code_url ? (
          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            {/* The API controls the media host, so this cannot use a fixed Next.js image allowlist. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={method.qr_code_url}
              alt={`${method.name} payment QR code`}
              className="size-[180px] rounded-lg object-contain"
            />
          </div>
        ) : (
          <ErrorMessage
            message={`${method.name} does not have a QR code configured yet.`}
          />
        )}
        {(method.account_name || method.account_number) && (
          <div className="text-center text-xs text-muted-foreground">
            {method.account_name && <p>{method.account_name}</p>}
            {method.account_number && (
              <p className="font-mono text-foreground">
                {method.account_number}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">
          Upload payment proof
        </p>
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) =>
            event.key === "Enter" && fileInputRef.current?.click()
          }
          onDragOver={(event) => {
            event.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragOver(false)
            acceptFile(event.dataTransfer.files[0])
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-all",
            dragOver
              ? "border-primary bg-primary/5"
              : proofFile
                ? "border-primary/50 bg-primary/5"
                : "border-muted-foreground/30 hover:border-muted-foreground/50"
          )}
        >
          {proofFile ? (
            <>
              <CheckCircle2Icon className="size-8 text-primary" />
              <p className="text-sm font-semibold text-foreground">
                {proofFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(proofFile.size / 1024).toFixed(1)} KB · Click to change
              </p>
            </>
          ) : (
            <>
              <UploadCloudIcon className="size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground">
                Drop your screenshot here
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse · PNG, JPG or WebP up to 10MB
              </p>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => acceptFile(event.target.files?.[0])}
          aria-label="Upload payment proof"
        />
      </div>
      <div className="flex flex-col gap-3 pt-2">
        <Button
          onClick={onContinue}
          disabled={!proofFile || !method.qr_code_url || isSubmitting}
          size="lg"
          className="w-full"
        >
          {isSubmitting ? <Spinner /> : "Submit card order"}
        </Button>
        <Button
          onClick={onBack}
          disabled={isSubmitting}
          variant="ghost"
          size="lg"
          className="w-full"
        >
          <ChevronLeftIcon data-icon="inline-start" />
          Go back
        </Button>
      </div>
    </div>
  )
}

function SuccessScreen({
  order,
  onClose,
}: {
  order: CardOrder
  onClose: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/20">
          <CheckCircle2Icon className="size-10 text-primary" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <TypographyH2 className="text-2xl font-bold">
          Card order submitted
        </TypographyH2>
        <TypographyMuted className="mx-auto max-w-xs">
          We&apos;ll review order {order.number} and notify your organization
          when its status changes.
        </TypographyMuted>
      </div>
      <div className="w-full rounded-xl border border-border bg-muted/50 p-4 text-left text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Selected card</span>
          <span className="font-semibold text-foreground">
            {order.design.name}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Status</span>
          <span className="font-semibold text-foreground">Pending review</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Total paid</span>
          <span className="font-mono font-semibold text-foreground">
            {order.total.amount.toLocaleString()} {order.total.currency}
          </span>
        </div>
      </div>
      <Button onClick={onClose} size="lg" className="w-full">
        Done
      </Button>
    </div>
  )
}

export function OrderCardFlow({ onClose }: { onClose: () => void }) {
  const organization = useActiveOrganization()
  const [catalog, setCatalog] = React.useState<CardOrderCatalog | null>(null)
  const [catalogError, setCatalogError] = React.useState<string | null>(null)
  const [isLoadingCatalog, setIsLoadingCatalog] = React.useState(true)
  const [currentStep, setCurrentStep] = React.useState<Step>("card")
  const [selectedDesign, setSelectedDesign] = React.useState<CardDesign | null>(
    null
  )
  const [selectedPurpose, setSelectedPurpose] =
    React.useState<CardPurpose | null>(null)
  const [selectedMethod, setSelectedMethod] =
    React.useState<CardPaymentMethod | null>(null)
  const [selectedCurrencyCode, setSelectedCurrencyCode] = React.useState<
    string | null
  >(null)
  const [initialBalance, setInitialBalance] = React.useState("")
  const [proofFile, setProofFile] = React.useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [completedOrder, setCompletedOrder] = React.useState<CardOrder | null>(
    null
  )
  const [idempotencyKey] = React.useState(() => crypto.randomUUID())

  const loadCatalog = React.useCallback(async () => {
    if (!organization) {
      throw new Error("Choose an organization before ordering a card.")
    }
    return fetchCardOrderCatalog(organization.id)
  }, [organization])

  React.useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const result = await loadCatalog()
        if (!cancelled) setCatalog(result)
      } catch (error) {
        if (!cancelled) {
          setCatalogError(
            error instanceof ApiError
              ? error.message
              : error instanceof Error
                ? error.message
                : "Failed to load available cards."
          )
        }
      } finally {
        if (!cancelled) setIsLoadingCatalog(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [loadCatalog])

  async function retryCatalog() {
    setIsLoadingCatalog(true)
    setCatalogError(null)
    try {
      setCatalog(await loadCatalog())
    } catch (error) {
      setCatalogError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to load available cards."
      )
    } finally {
      setIsLoadingCatalog(false)
    }
  }

  const steps = PREMIUM_STEPS

  async function submitOrder() {
    if (
      !organization ||
      !selectedDesign ||
      !selectedPurpose ||
      !selectedCurrencyCode
    )
      return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const order = await createCardOrder(organization.id, {
        cardDesignId: selectedDesign.id,
        cardPurposeId: selectedPurpose.id,
        currencyCode: selectedCurrencyCode,
        initialBalanceAmount:
          initialBalance === "" ? 0 : Number(initialBalance),
        idempotencyKey,
        cardPaymentMethodId: selectedMethod?.id,
        paymentProof: proofFile ?? undefined,
      })
      setCompletedOrder(order)
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "Failed to submit your card order."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function goBack() {
    setSubmitError(null)
    if (currentStep === "purpose") setCurrentStep("card")
    else if (currentStep === "balance") setCurrentStep("purpose")
    else if (currentStep === "payment") setCurrentStep("balance")
    else if (currentStep === "verification") setCurrentStep("payment")
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-label="Order card"
    >
      {!completedOrder && (
        <StepperHeader current={currentStep} steps={steps} onClose={onClose} />
      )}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-xl px-6 py-8">
          {completedOrder ? (
            <SuccessScreen order={completedOrder} onClose={onClose} />
          ) : isLoadingCatalog ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              <Spinner />
              Loading available cards…
            </div>
          ) : catalogError ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-4">
              <ErrorMessage message={catalogError} />
              <Button onClick={() => void retryCatalog()} variant="outline">
                Try again
              </Button>
            </div>
          ) : !catalog || catalog.designs.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
              <TypographyH2 className="text-foreground">
                No cards available
              </TypographyH2>
              <TypographyMuted>
                Card ordering is temporarily unavailable.
              </TypographyMuted>
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {submitError && <ErrorMessage message={submitError} />}
              {currentStep === "card" ? (
                <CardStep
                  catalog={catalog}
                  selected={selectedDesign}
                  onSelect={(design) => {
                    setSelectedDesign(design)
                    setSelectedMethod(null)
                    setSelectedCurrencyCode(null)
                    setInitialBalance("")
                    setProofFile(null)
                  }}
                  onContinue={() => setCurrentStep("purpose")}
                  onCancel={onClose}
                />
              ) : currentStep === "purpose" ? (
                <PurposeStep
                  purposes={catalog.purposes}
                  selected={selectedPurpose}
                  onSelect={setSelectedPurpose}
                  onContinue={async (customData) => {
                    if (customData?.isCustom) {
                      if (!organization) return
                      setIsSubmitting(true)
                      setSubmitError(null)
                      try {
                        const newPurpose = await createCardPurpose(
                          organization.id,
                          {
                            name: customData.name,
                            description: customData.description || undefined,
                          }
                        )
                        setCatalog((prev) => {
                          if (!prev) return prev
                          return {
                            ...prev,
                            purposes: [...prev.purposes, newPurpose],
                          }
                        })
                        setSelectedPurpose(newPurpose)
                        setCurrentStep("balance")
                      } catch (error) {
                        setSubmitError(
                          error instanceof ApiError
                            ? error.message
                            : "Failed to create custom purpose."
                        )
                      } finally {
                        setIsSubmitting(false)
                      }
                    } else {
                      setCurrentStep("balance")
                    }
                  }}
                  onBack={goBack}
                  isSubmitting={isSubmitting}
                />
              ) : currentStep === "balance" ? (
                <BalanceStep
                  selectedCurrencyCode={selectedCurrencyCode}
                  initialBalance={initialBalance}
                  onSelect={setSelectedCurrencyCode}
                  onInitialBalanceChange={setInitialBalance}
                  onContinue={() => setCurrentStep("payment")}
                  onBack={goBack}
                />
              ) : currentStep === "payment" && selectedDesign ? (
                <PaymentStep
                  design={selectedDesign}
                  methods={catalog.payment_methods}
                  selected={selectedMethod}
                  initialBalanceAmount={
                    initialBalance === "" ? 0 : Number(initialBalance)
                  }
                  onSelect={setSelectedMethod}
                  onContinue={() => {
                    const balance =
                      initialBalance === "" ? 0 : Number(initialBalance)
                    if (selectedDesign.price.amount + balance > 0) {
                      setCurrentStep("verification")
                    } else {
                      void submitOrder()
                    }
                  }}
                  onBack={goBack}
                />
              ) : currentStep === "verification" &&
                selectedDesign &&
                selectedMethod ? (
                <VerificationStep
                  design={selectedDesign}
                  method={selectedMethod}
                  initialBalanceAmount={
                    initialBalance === "" ? 0 : Number(initialBalance)
                  }
                  proofFile={proofFile}
                  onFileChange={setProofFile}
                  onContinue={() => void submitOrder()}
                  onBack={goBack}
                  isSubmitting={isSubmitting}
                />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
