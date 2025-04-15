import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { CustomersList } from "@/components/customers/customers-list";

export default function CustomersPage() {
  return (
    <>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Invoices</h1>
        <DashboardShell>
          <CustomersList />
        </DashboardShell>
      </div>
    </>
  );
}
