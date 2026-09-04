export function hasPositiveAmount(amount: string): boolean {
  return Number.isFinite(Number(amount)) && Number(amount) > 0
}

export function formatAmount(amount: string | number): string {
  const value = Number(amount)

  return Number.isFinite(value)
    ? value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00"
}
