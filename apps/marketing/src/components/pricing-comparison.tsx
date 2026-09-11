import { Fragment } from "react"
import { CheckIcon, MinusIcon } from "lucide-react"

type Cell = string | boolean

type Row = {
  label: string
  values: [Cell, Cell, Cell, Cell]
}

type Group = {
  title: string
  rows: Row[]
}

const tiers = ["Basic", "Growth", "Scale", "Enterprise"] as const

const groups: Group[] = [
  {
    title: "Capacity",
    rows: [
      { label: "Price / month", values: ["$15", "$79", "$249", "Custom"] },
      { label: "Team members", values: ["Unlimited", "Unlimited", "Unlimited", "Unlimited"] },
      { label: "Channels", values: ["1", "3", "All 7", "Unlimited"] },
      { label: "Storage", values: ["2 GB", "15 GB", "75 GB", "Unlimited"] },
      { label: "Organizations", values: ["1", "2", "5", "Unlimited"] },
      { label: "AI credits / month", values: ["5,000", "30,000", "200,000", "Unlimited"] },
    ],
  },
  {
    title: "Features",
    rows: [
      { label: "Shared inbox & messaging", values: [true, true, true, true] },
      { label: "Knowledge base", values: [true, true, true, true] },
      { label: "AI auto-reply", values: [true, true, true, true] },
      { label: "File sharing", values: [false, true, true, true] },
      { label: "AI document drafting", values: [false, false, true, true] },
      { label: "Priority support", values: [false, false, true, true] },
      { label: "Single sign-on (SSO)", values: [false, false, false, true] },
      { label: "Audit logs", values: [false, false, false, true] },
    ],
  },
]

function CellValue({ value }: { value: Cell }) {
  if (typeof value === "boolean") {
    return value ? (
      <CheckIcon className="mx-auto size-4 text-primary" aria-label="Included" />
    ) : (
      <MinusIcon className="mx-auto size-4 text-muted-foreground/50" aria-label="Not included" />
    )
  }

  return <span className="text-sm">{value}</span>
}

export function PricingComparison() {
  return (
    <section className="border-t bg-background px-6 py-12 sm:px-10 lg:px-16 lg:py-16 xl:px-24">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-2xl font-medium tracking-tight sm:text-3xl">
            Compare every plan
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            The knowledge base and AI assistant are on every tier — plans scale on capacity and advanced controls.
          </p>
        </div>

        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-background pb-4 pr-4 align-bottom text-sm font-medium text-muted-foreground">
                  Plan
                </th>
                {tiers.map((tier) => (
                  <th
                    key={tier}
                    className="pb-4 text-center text-sm font-semibold"
                    scope="col"
                  >
                    {tier}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <Fragment key={group.title}>
                  <tr>
                    <th
                      colSpan={5}
                      scope="colgroup"
                      className="border-t bg-muted/40 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {group.title}
                    </th>
                  </tr>
                  {group.rows.map((row) => (
                    <tr key={row.label}>
                      <th
                        scope="row"
                        className="sticky left-0 z-10 border-t bg-background py-3 pr-4 text-left text-sm font-normal"
                      >
                        {row.label}
                      </th>
                      {row.values.map((value, index) => (
                        <td key={tiers[index]} className="border-t py-3 text-center">
                          <CellValue value={value} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
