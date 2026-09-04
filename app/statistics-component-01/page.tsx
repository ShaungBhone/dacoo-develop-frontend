import {
  CalendarX2Icon,
  Clock8Icon,
  TriangleAlertIcon,
  TruckIcon,
} from "@/components/ui/icons"

import StatisticsCard from "@/components/shadcn-studio/blocks/statistics-card-01"

const statisticsCardData = [
  {
    icon: <TruckIcon className="size-4" />,
    value: "42",
    title: "Shipped Orders",
    changePercentage: "+18.2%",
  },
  {
    icon: <TriangleAlertIcon className="size-4" />,
    value: "8",
    title: "Damaged Returns",
    changePercentage: "-8.7%",
  },
  {
    icon: <CalendarX2Icon className="size-4" />,
    value: "27",
    title: "Missed Delivery Slots",
    changePercentage: "+4.3%",
  },
  {
    icon: <Clock8Icon className="size-4" />,
    value: "13",
    title: "Late Deliveries",
    changePercentage: "-2.5%",
  },
]

export default function StatisticsCardPreview() {
  return (
    <div className="py-8 sm:py-16 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {statisticsCardData.map((card) => (
          <StatisticsCard
            key={card.title}
            icon={card.icon}
            title={card.title}
            value={card.value}
            changePercentage={card.changePercentage}
          />
        ))}
      </div>
    </div>
  )
}
