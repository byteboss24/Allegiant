import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { AgentConfig } from "@/components/agent/agent-config"

export default function AgentPage() {
  return (
    <>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Agent Configuration</h1>
        <DashboardShell>
          <AgentConfig />
        </DashboardShell>
      </div>
    </>
  )
}
