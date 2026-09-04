import { TransactionsView } from "@/components/transactions-view"

export const metadata = {
  title: "Transactions",
  description: "View your organization's transaction history.",
}

export default function TransactionsPage() {
  return <TransactionsView />
}
