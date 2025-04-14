"use client"

import { CallRecordings } from "@/components/calls/call-recordings"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default function CallsPage() {
  return (
    <DashboardShell>
      <CallRecordings />
    </DashboardShell>
  )
}
