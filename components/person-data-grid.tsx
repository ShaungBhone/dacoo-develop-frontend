"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid"

import { Badge } from "@/components/reui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { DataTable } from "@/components/data-table"

type Person = {
  id: string
  name: string
  avatar: string
  status: "active" | "inactive"
  email: string
  company: string
  role: string
  joined: string
  location: string
  balance: number
}

const people: Person[] = [
  { id: "1", name: "Alex Johnson", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&h=96&dpr=2&q=80", status: "active", email: "alex@apple.com", company: "Apple", role: "CEO", joined: "Jan, 2024", location: "United States", balance: 5143.03 },
  { id: "2", name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=96&h=96&dpr=2&q=80", status: "inactive", email: "sarah@openai.com", company: "OpenAI", role: "CTO", joined: "Mar, 2023", location: "United Kingdom", balance: 4321.87 },
  { id: "3", name: "Michael Rodriguez", avatar: "https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=96&h=96&dpr=2&q=80", status: "active", email: "michael@meta.com", company: "Meta", role: "Designer", joined: "Jun, 2022", location: "Canada", balance: 7654.98 },
  { id: "4", name: "Emma Wilson", avatar: "https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=96&h=96&dpr=2&q=80", status: "inactive", email: "emma@tesla.com", company: "Tesla", role: "Developer", joined: "Sep, 2024", location: "Australia", balance: 3456.45 },
  { id: "5", name: "David Kim", avatar: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=96&h=96&dpr=2&q=80", status: "active", email: "david@sap.com", company: "SAP", role: "Lawyer", joined: "Nov, 2023", location: "Germany", balance: 9876.54 },
  { id: "6", name: "Aron Thompson", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=96&h=96&dpr=2&q=80", status: "active", email: "aron@keenthemes.com", company: "Keenthemes", role: "Director", joined: "Feb, 2022", location: "Malaysia", balance: 6214.22 },
]

export function PersonDataGrid() {
  const columns = React.useMemo<ColumnDef<DataGridFeatures, Person>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar className="size-6">
              <AvatarImage src={row.original.avatar} alt={row.original.name} />
              <AvatarFallback>{row.original.name.split(" ").map((part) => part[0]).join("")}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">{row.original.name}</span>
          </div>
        ),
      },
      { accessorKey: "email", header: "Email", cell: ({ getValue }) => <a href={`mailto:${getValue<string>()}`} className="hover:text-primary hover:underline">{getValue<string>()}</a> },
      { accessorKey: "location", header: "Location" },
      { accessorKey: "company", header: "Company", cell: ({ getValue }) => <span className="font-medium text-foreground">{getValue<string>()}</span> },
      { accessorKey: "role", header: "Role", cell: ({ getValue }) => <span className="text-muted-foreground">{getValue<string>()}</span> },
      { accessorKey: "joined", header: "Joined", cell: ({ getValue }) => <span className="text-muted-foreground">{getValue<string>()}</span> },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <Badge variant={getValue() === "active" ? "success-outline" : "warning-outline"}>{getValue() === "active" ? "Approved" : "Pending"}</Badge> },
      { accessorKey: "balance", header: () => <span className="block text-right">Balance</span>, cell: ({ getValue }) => <div className="text-right font-medium tabular-nums">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(getValue<number>())}</div> },
    ],
    []
  )

  return (
    <Card className="m-4 min-h-0 flex-1 gap-0 p-0">
      <DataTable
        columns={columns}
        data={people}
        initialPageSize={5}
        showToolbar={false}
        emptyMessage="No people found."
        getRowId={(person) => person.id}
        className="min-h-0 flex-1 gap-0"
        containerClassName="min-h-0 flex-1 overflow-auto"
        headerClassName="bg-muted"
        rowClassName="bg-background hover:bg-muted/30"
        footerClassName="border-t border-border px-4 py-3"
      />
    </Card>
  )
}
