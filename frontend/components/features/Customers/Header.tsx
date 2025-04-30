import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkle } from "lucide-react";

export default function InvoicesHeader() {
  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center rounded-full bg-blue-100 p-2 dark:bg-blue-900">
          <Sparkle className="text-blue-500 dark:text-blue-300 w-6 h-6" />
        </span>
        <CardTitle className="text-xl font-bold">Invoices</CardTitle>
        <CardDescription>
          Manage customer invoices and payment status
        </CardDescription>
      </div>
    </CardHeader>
  );
}
