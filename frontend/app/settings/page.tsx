import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        <DashboardShell>
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure your voice AI system settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Settings content will go here</p>
            </CardContent>
          </Card>
        </DashboardShell>
      </div>
    </>
  )
}
