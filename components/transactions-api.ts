import { apiFetch } from "@/lib/api"

export type TransactionType = "debit" | "credit"

export type Transaction = {
  id: number
  organization_id?: number
  wallet_id?: number | string | null
  type: TransactionType
  amount: string
  currency_code: string
  balance_after?: string | null
  description?: string | null
  model?: string | null
  status?: string | null
  reference?: string | null
  created_at: string
}

export async function fetchTransactions(
  organizationId: number
): Promise<Transaction[]> {
  const res = await apiFetch<{ data: Transaction[] }>(
    `/api/v1/organizations/${organizationId}/transactions`
  )
  return res.data
}
