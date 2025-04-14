"use client"

import { AgentConfig } from "@/components/agent/agent-config"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default function AgentPage() {
  return (
    <DashboardShell>
      <AgentConfig />
    </DashboardShell>
  )
}
