import { CircleAlert, CircleCheck } from "lucide-react"

export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <aside className="mt-6 flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
      <CircleAlert className="mt-0.5 size-4 shrink-0 text-primary" />
      <div>{children}</div>
    </aside>
  )
}

export function Steps({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-xl border bg-card p-5 [&>ol]:mt-0 [&>ol]:flex [&>ol]:list-none [&>ol]:flex-col [&>ol]:gap-4 [&>ol]:p-0 [&>ol>li]:flex [&>ol>li]:gap-3">
      <CircleCheck className="sr-only" />
      {children}
    </div>
  )
}
