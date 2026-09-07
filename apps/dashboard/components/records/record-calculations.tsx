import * as React from "react"
import type { Attribute, RecordItem } from "@/components/records/api"
import type { CurrencySettings } from "@/components/settings/currency-api"
import { formatCurrencyAttribute } from "@/components/records/currency-attribute"

export type CalculationType =
  | "count"
  | "filled"
  | "empty"
  | "percent_filled"
  | "percent_empty"
  | "unique"
  | "sum"
  | "average"
  | "min"
  | "max"
  | "range"
  | "none"

export const CALCULATION_OPTIONS: { type: CalculationType; label: string }[] = [
  { type: "count", label: "Count all" },
  { type: "filled", label: "Count filled" },
  { type: "empty", label: "Count empty" },
  { type: "percent_filled", label: "Percent filled" },
  { type: "percent_empty", label: "Percent empty" },
  { type: "unique", label: "Count unique" },
]

export const NUMERIC_OPTIONS: { type: CalculationType; label: string }[] = [
  { type: "sum", label: "Sum" },
  { type: "average", label: "Average" },
  { type: "min", label: "Min" },
  { type: "max", label: "Max" },
  { type: "range", label: "Range" },
]

export function isNumericAttribute(attribute?: Attribute): boolean {
  if (!attribute) return false
  return (
    attribute.type === "number" ||
    attribute.type === "currency" ||
    attribute.type === "rating"
  )
}

export function computeCalculation(
  records: RecordItem[],
  columnId: string,
  calcType: CalculationType,
  attribute?: Attribute,
  currencySettings: CurrencySettings | null = null
): React.ReactNode {
  const total = records.length
  if (total === 0) return <span className="text-muted-foreground">—</span>

  const rawValues = records.map((r) =>
    columnId === "title" ? r.title : r.values[columnId]
  )

  const isFilled = (val: unknown) =>
    val != null && val !== "" && (!Array.isArray(val) || val.length > 0)

  const filledCount = rawValues.filter(isFilled).length
  const emptyCount = total - filledCount

  switch (calcType) {
    case "count":
      return (
        <>
          <span className="font-semibold text-foreground">{total}</span> count
        </>
      )
    case "filled":
      return (
        <>
          <span className="font-semibold text-foreground">{filledCount}</span>{" "}
          filled
        </>
      )
    case "empty":
      return (
        <>
          <span className="font-semibold text-foreground">{emptyCount}</span>{" "}
          empty
        </>
      )
    case "percent_filled": {
      const pct = Math.round((filledCount / total) * 100)
      return (
        <>
          <span className="font-semibold text-foreground">{pct}%</span> filled
        </>
      )
    }
    case "percent_empty": {
      const pct = Math.round((emptyCount / total) * 100)
      return (
        <>
          <span className="font-semibold text-foreground">{pct}%</span> empty
        </>
      )
    }
    case "unique": {
      const uniqueValues = new Set(
        rawValues
          .filter(isFilled)
          .map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v)))
      )
      return (
        <>
          <span className="font-semibold text-foreground">
            {uniqueValues.size}
          </span>{" "}
          unique
        </>
      )
    }
    case "sum":
    case "average":
    case "min":
    case "max":
    case "range": {
      const nums = rawValues
        .map((v) => (typeof v === "number" ? v : Number(v)))
        .filter((v) => !isNaN(v))

      if (nums.length === 0)
        return <span className="text-muted-foreground">—</span>

      const isCurrency = attribute?.type === "currency"
      const formatNum = (n: number) => {
        const formatted = Number.isInteger(n)
          ? n.toLocaleString()
          : n.toFixed(2)
        return isCurrency && attribute
          ? formatCurrencyAttribute(n, attribute, currencySettings)
          : formatted
      }

      if (calcType === "sum") {
        const sum = nums.reduce((a, b) => a + b, 0)
        return (
          <>
            sum{" "}
            <span className="font-semibold text-foreground">
              {formatNum(sum)}
            </span>
          </>
        )
      }
      if (calcType === "average") {
        const avg = nums.reduce((a, b) => a + b, 0) / nums.length
        return (
          <>
            avg{" "}
            <span className="font-semibold text-foreground">
              {formatNum(avg)}
            </span>
          </>
        )
      }
      if (calcType === "min") {
        const min = Math.min(...nums)
        return (
          <>
            min{" "}
            <span className="font-semibold text-foreground">
              {formatNum(min)}
            </span>
          </>
        )
      }
      if (calcType === "max") {
        const max = Math.max(...nums)
        return (
          <>
            max{" "}
            <span className="font-semibold text-foreground">
              {formatNum(max)}
            </span>
          </>
        )
      }
      if (calcType === "range") {
        const range = Math.max(...nums) - Math.min(...nums)
        return (
          <>
            range{" "}
            <span className="font-semibold text-foreground">
              {formatNum(range)}
            </span>
          </>
        )
      }
      return null
    }
    case "none":
    default:
      return null
  }
}
