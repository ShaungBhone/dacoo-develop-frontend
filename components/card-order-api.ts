import { apiFetch } from "@/lib/api"
import { isCardTheme, type CardTheme } from "@/components/payment-card"

export type CardTier = "standard" | "premium"

export type CardDesign = {
  id: string
  name: string
  slug: string
  theme: CardTheme
  tier: CardTier
  price: {
    amount: number
    currency: string
  }
}

export type CardPurpose = {
  id: string
  name: string
  slug: string
  description: string | null
}

export type CardPaymentMethod = {
  id: string
  name: string
  slug: string
  brand_color: string
  account_name: string | null
  account_number: string | null
  logo_url: string | null
  qr_code_url: string | null
}

export type CardOrderCatalog = {
  designs: CardDesign[]
  purposes: CardPurpose[]
  payment_methods: CardPaymentMethod[]
}

export type IssuedCard = {
  last_four: string
  cardholder_name: string | null
  expiry_date: string | null
}

export type CardWallet = {
  id: string
  currency_code: string
  balance: string
}

export type CardOrderStatus =
  | "pending_review"
  | "approved"
  | "processing"
  | "shipped"
  | "rejected"
  | "cancelled"

export type CardOrder = {
  id: string
  number: string
  status: CardOrderStatus
  design: {
    name: string
    theme: CardTheme
  }
  purpose: string
  payment_method: string | null
  price: {
    amount: number
    currency: string
  }
  initial_balance: {
    amount: number
    currency: string
  }
  total: {
    amount: number
    currency: string
  }
  card: IssuedCard | null
  wallet: CardWallet | null
  rejection_reason: string | null
  reviewed_at: string | null
  created_at: string
}

export type CardFundingTransfer = {
  id: string
  organization_id: number
  from_wallet: CardWallet
  to_wallet: CardWallet
  from_amount: string
  to_amount: string
  rate: string
  rate_source: string
  executed_by: number
  created_at: string
}

export async function fetchCardOrderCatalog(
  organizationId: number
): Promise<CardOrderCatalog> {
  const response = await apiFetch<{ data: CardOrderCatalog }>(
    `/api/v1/organizations/${organizationId}/card-order-catalog`
  )

  return {
    ...response.data,
    designs: response.data.designs.filter((design) =>
      isCardTheme(design.theme)
    ),
  }
}

export async function fetchCardOrders(
  organizationId: number
): Promise<CardOrder[]> {
  const response = await apiFetch<{ data: CardOrder[] }>(
    `/api/v1/organizations/${organizationId}/card-orders`
  )

  return response.data
}

export async function openCardBalance(
  organizationId: number,
  cardOrderId: string,
  currencyCode: string
): Promise<CardOrder> {
  const response = await apiFetch<{ data: CardOrder }>(
    `/api/v1/organizations/${organizationId}/card-orders/${cardOrderId}/wallet`,
    { method: "POST", body: { currency_code: currencyCode } }
  )

  return response.data
}

export async function fundCardWallet(
  organizationId: number,
  cardOrderId: string,
  fromCurrency: string,
  amount: string
): Promise<CardFundingTransfer> {
  const response = await apiFetch<{ data: CardFundingTransfer }>(
    `/api/v1/organizations/${organizationId}/card-orders/${cardOrderId}/fund`,
    { method: "POST", body: { from_currency: fromCurrency, amount } }
  )

  return response.data
}

export async function createCardOrder(
  organizationId: number,
  input: {
    cardDesignId: string
    cardPurposeId: string
    currencyCode: string
    initialBalanceAmount: number
    idempotencyKey: string
    cardPaymentMethodId?: string
    paymentProof?: File
  }
): Promise<CardOrder> {
  const body = new FormData()
  body.append("card_design_id", input.cardDesignId)
  body.append("card_purpose_id", input.cardPurposeId)
  body.append("currency_code", input.currencyCode)
  body.append("initial_balance_amount", String(input.initialBalanceAmount))
  body.append("idempotency_key", input.idempotencyKey)

  if (input.cardPaymentMethodId) {
    body.append("card_payment_method_id", input.cardPaymentMethodId)
  }
  if (input.paymentProof) {
    body.append("payment_proof", input.paymentProof)
  }

  const response = await apiFetch<{ data: CardOrder }>(
    `/api/v1/organizations/${organizationId}/card-orders`,
    { method: "POST", body }
  )

  return response.data
}

export async function createCardPurpose(
  organizationId: number,
  input: {
    name: string
    description?: string
  }
): Promise<CardPurpose> {
  const response = await apiFetch<{ data: CardPurpose }>(
    `/api/v1/organizations/${organizationId}/card-purposes`,
    { method: "POST", body: input }
  )

  return response.data
}
