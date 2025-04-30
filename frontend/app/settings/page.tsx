import { DashboardShell } from "@/components/Dashboard/DashboardShell"
import { Card, CardContent } from "@/components/ui/card"
import SettingsHeader from "./SettingsHeader";

export default function SettingsPage() {
  return (
    <>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        <DashboardShell>
          <Card>
            <SettingsHeader />
            <CardContent>
              <p>Settings content will go here</p>
            </CardContent>
          </Card>
        </DashboardShell>
      </div>
    </>
  )
}
