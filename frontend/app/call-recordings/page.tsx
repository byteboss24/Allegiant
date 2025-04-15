import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { CallRecordings } from "@/components/calls/call-recordings";

export default function CallRecordingsPage() {
  return (
    <>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Call Recordings</h1>
        <DashboardShell>
          <CallRecordings />
        </DashboardShell>
      </div>
    </>
  );
}
