import type { ReactElement } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"

type MetricItem = {
  icon: ReactElement
  value: string
  label: string
}

export default function SocialProof({ metrics }: { metrics: MetricItem[] }) {
  return (
    <section className="py-8 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-md bg-muted px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col gap-4 sm:mb-16 lg:mb-24">
            <h2 className="text-2xl font-semibold md:text-3xl lg:text-4xl">
              Key Performance Metrics
            </h2>
            <p className="max-w-4xl text-xl text-muted-foreground">
              Unlock your business potential with our expert guidance. Discover
              innovative strategies to elevate your success.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <Card key={metric.label}>
                <CardContent className="flex flex-col items-center [&>svg]:size-7 [&>svg]:text-muted-foreground">
                  {metric.icon}
                  <CardTitle className="mt-4 mb-3 text-2xl leading-10 font-semibold md:text-3xl lg:text-4xl">
                    {metric.value}
                  </CardTitle>
                  <CardDescription className="text-xl font-medium">
                    {metric.label}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
