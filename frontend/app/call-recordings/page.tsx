import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { CallRecordings } from "@/components/calls/call-recordings"

export default function CallRecordingsPage() {
  return (
    <>
      <div className="container mx-auto py-8">
        <DashboardShell>
          <CallRecordings />
        </DashboardShell>
      </div>
    </>
  )
}
