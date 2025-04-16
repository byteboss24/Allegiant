import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { CustomersList } from "@/components/customers/customers-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function InvoicesPage() {
  return (
    <>
      <div className="container mx-auto py-8">
        <DashboardShell>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-2xl font-bold">Invoices</CardTitle>
                <CardDescription>Manage customer invoices and payment status</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <CustomersList />
            </CardContent>
          </Card>
        </DashboardShell>
      </div>
    </>
  )
}
