"use client"

import { CustomersList } from "@/components/customers/customers-list"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default function CustomersPage() {
  return (
    <DashboardShell>
      <CustomersList />
    </DashboardShell>
  )
}
